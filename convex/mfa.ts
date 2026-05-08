import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

function generateSecret(length: number = 20): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < length; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    codes.push(code.slice(0, 4) + "-" + code.slice(4));
  }
  return codes;
}

function generateTOTP(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const timeHex = time.toString(16).padStart(16, "0");
  
  let hash = 0;
  const combined = secret + timeHex;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const otp = Math.abs(hash % 1000000);
  return otp.toString().padStart(6, "0");
}

function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -window; i <= window; i++) {
    const time = currentTime + i;
    const timeHex = time.toString(16).padStart(16, "0");
    
    let hash = 0;
    const combined = secret + timeHex;
    for (let j = 0; j < combined.length; j++) {
      const char = combined.charCodeAt(j);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const otp = Math.abs(hash % 1000000).toString().padStart(6, "0");
    if (otp === code) {
      return true;
    }
  }
  return false;
}

export const getMfaStatus = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return null;

    return {
      mfaEnabled: profile.mfaEnabled || false,
      mfaVerifiedAt: profile.mfaVerifiedAt,
      hasBackupCodes: (profile.mfaBackupCodes?.length || 0) > 0,
    };
  },
});

export const setupMfa = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");

    if (profile.mfaEnabled) {
      throw new Error("MFA is already enabled");
    }

    const secret = generateSecret(16);
    const backupCodes = generateBackupCodes(8);

    await ctx.db.patch(profile._id, {
      mfaSecret: secret,
      mfaBackupCodes: backupCodes,
    });

    const otpAuthUrl = `otpauth://totp/VeraFlow:${encodeURIComponent(profile.email)}?secret=${secret}&issuer=VeraFlow&algorithm=SHA1&digits=6&period=30`;

    return {
      secret,
      otpAuthUrl,
      backupCodes,
    };
  },
});

export const verifyAndEnableMfa = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");
    if (!profile.mfaSecret) throw new Error("MFA setup not initiated");
    if (profile.mfaEnabled) throw new Error("MFA is already enabled");

    const isValid = verifyTOTP(profile.mfaSecret, args.code.replace(/\s/g, ""));
    
    if (!isValid) {
      throw new Error("Invalid verification code");
    }

    await ctx.db.patch(profile._id, {
      mfaEnabled: true,
      mfaVerifiedAt: Date.now(),
    });

    return { success: true };
  },
});

export const verifyMfaCode = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");
    if (!profile.mfaEnabled || !profile.mfaSecret) {
      return { success: true, requiresMfa: false };
    }

    const code = args.code.replace(/[\s-]/g, "");
    
    const isValidTotp = verifyTOTP(profile.mfaSecret, code);
    if (isValidTotp) {
      return { success: true, requiresMfa: true };
    }

    const backupCodes = profile.mfaBackupCodes || [];
    const formattedCode = code.length === 8 
      ? code.slice(0, 4) + "-" + code.slice(4) 
      : code;
    const codeIndex = backupCodes.indexOf(formattedCode);
    
    if (codeIndex !== -1) {
      const newBackupCodes = [...backupCodes];
      newBackupCodes.splice(codeIndex, 1);
      await ctx.db.patch(profile._id, {
        mfaBackupCodes: newBackupCodes,
      });
      return { success: true, requiresMfa: true, usedBackupCode: true };
    }

    throw new Error("Invalid verification code");
  },
});

export const disableMfa = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");
    if (!profile.mfaEnabled || !profile.mfaSecret) {
      throw new Error("MFA is not enabled");
    }

    const isValid = verifyTOTP(profile.mfaSecret, args.code.replace(/\s/g, ""));
    
    if (!isValid) {
      throw new Error("Invalid verification code");
    }

    await ctx.db.patch(profile._id, {
      mfaEnabled: false,
      mfaSecret: undefined,
      mfaBackupCodes: undefined,
      mfaVerifiedAt: undefined,
    });

    return { success: true };
  },
});

export const regenerateBackupCodes = mutation({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new Error("Profile not found");
    if (!profile.mfaEnabled || !profile.mfaSecret) {
      throw new Error("MFA is not enabled");
    }

    const isValid = verifyTOTP(profile.mfaSecret, args.code.replace(/\s/g, ""));
    
    if (!isValid) {
      throw new Error("Invalid verification code");
    }

    const newBackupCodes = generateBackupCodes(8);
    
    await ctx.db.patch(profile._id, {
      mfaBackupCodes: newBackupCodes,
    });

    return { backupCodes: newBackupCodes };
  },
});

export const checkMfaRequired = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { required: false, authenticated: false };

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) return { required: false, authenticated: true };

    return {
      required: profile.mfaEnabled || false,
      authenticated: true,
    };
  },
});
