import { httpRouter } from "convex/server";
import { createHmac, timingSafeEqual } from "crypto";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/paddle-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.PADDLE_WEBHOOK_SECRET;
    const apiKey = process.env.PADDLE_API_KEY;

    if (!secret) {
      console.error("PADDLE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const rawBody = await request.text();
    const sigHeader =
      request.headers.get("paddle-signature") ??
      request.headers.get("Paddle-Signature");

    if (!verifyPaddleSignature(rawBody, sigHeader, secret)) {
      console.error("Paddle webhook signature verification failed");
      return new Response("Invalid signature", { status: 401 });
    }

    let event: {
      event_id?: string;
      event_type?: string;
      data?: Record<string, unknown>;
    };
    try {
      event = JSON.parse(rawBody);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const eventType = event.event_type ?? "";
    const data = event.data ?? {};

    try {
      switch (eventType) {
        case "subscription.created":
        case "subscription.updated":
        case "subscription.trialing":
        case "subscription.activated":
        case "subscription.resumed":
        case "subscription.past_due": {
          if (!apiKey) {
            console.error("PADDLE_API_KEY not configured for webhook enrichment");
            return new Response("Server misconfigured", { status: 500 });
          }
          await syncSubscriptionFromWebhookPayload(ctx, data, apiKey);
          break;
        }

        case "subscription.canceled": {
          if (!apiKey) {
            console.error("PADDLE_API_KEY not configured for webhook enrichment");
            return new Response("Server misconfigured", { status: 500 });
          }
          await syncSubscriptionFromWebhookPayload(ctx, data, apiKey);
          break;
        }

        case "transaction.completed": {
          if (!apiKey) break;
          const subscriptionId = data.subscription_id as string | undefined;
          if (!subscriptionId) break;

          const subRes = await fetch(
            `https://api.paddle.com/subscriptions/${subscriptionId}`,
            { headers: { Authorization: `Bearer ${apiKey}` } }
          );
          const subJson = (await subRes.json()) as {
            data?: Record<string, unknown>;
          };
          if (subJson.data) {
            await syncSubscriptionFromWebhookPayload(ctx, subJson.data, apiKey);
          }
          break;
        }

        default:
          console.log(`Unhandled Paddle event type: ${eventType}`);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error processing Paddle webhook:", error);
      return new Response("Webhook processing failed", { status: 500 });
    }
  }),
});

function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !secret) return false;

  let ts = "";
  let h1 = "";
  for (const part of signatureHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const val = part.slice(eq + 1).trim();
    if (key === "ts") ts = val;
    if (key === "h1") h1 = val;
  }
  if (!ts || !h1) return false;

  const tsNum = parseInt(ts, 10);
  if (Number.isFinite(tsNum)) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - tsNum) > 300) {
      return false;
    }
  }

  const signedPayload = `${ts}:${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  try {
    const a = Buffer.from(h1, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function mapPaddleStatus(
  status: string
): "active" | "canceled" | "past_due" | "trialing" {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "paused":
      return "active";
    default:
      return "active";
  }
}

function billingPeriodTimes(data: Record<string, unknown>): {
  start: number;
  end: number;
} {
  const period = data.current_billing_period as
    | { starts_at?: string; ends_at?: string }
    | null
    | undefined;
  const now = Date.now();
  if (period?.starts_at && period?.ends_at) {
    return {
      start: new Date(period.starts_at).getTime(),
      end: new Date(period.ends_at).getTime(),
    };
  }
  const next = data.next_billed_at as string | null | undefined;
  const end = next ? new Date(next).getTime() : now + 30 * 24 * 60 * 60 * 1000;
  return { start: now, end: end };
}

function deriveCancelAtPeriodEnd(data: Record<string, unknown>): boolean {
  const status = data.status as string;
  if (status === "canceled") return true;
  const sc = data.scheduled_change as { action?: string } | null | undefined;
  return sc?.action === "cancel";
}

function resolvePlan(data: Record<string, unknown>): "starter" | "professional" | "enterprise" {
  const cd = data.custom_data as Record<string, unknown> | null | undefined;
  const p = cd?.plan;
  if (p === "starter" || p === "professional" || p === "enterprise") {
    return p;
  }

  const items = data.items as Array<{ price?: { id?: string } }> | undefined;
  const priceId = items?.[0]?.price?.id;

  const starter = process.env.PADDLE_PRICE_STARTER?.trim();
  const professional = process.env.PADDLE_PRICE_PROFESSIONAL?.trim();
  const enterprise = process.env.PADDLE_PRICE_ENTERPRISE?.trim();

  if (priceId && starter && priceId === starter) return "starter";
  if (priceId && professional && priceId === professional) return "professional";
  if (priceId && enterprise && priceId === enterprise) return "enterprise";

  return "starter";
}

async function fetchCustomerEmail(
  apiKey: string,
  customerId: string
): Promise<string> {
  const res = await fetch(`https://api.paddle.com/customers/${customerId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) return "";
  const json = (await res.json()) as { data?: { email?: string } };
  return json.data?.email ?? "";
}

async function syncSubscriptionFromWebhookPayload(
  ctx: { runMutation: (...args: unknown[]) => Promise<unknown> },
  data: Record<string, unknown>,
  apiKey: string
): Promise<void> {
  const subscriptionId = String(data.id ?? "");
  const customerId = String(data.customer_id ?? "");
  if (!subscriptionId || !customerId) return;

  const email = await fetchCustomerEmail(apiKey, customerId);
  if (!email) {
    console.error("Paddle webhook: could not resolve customer email", customerId);
    return;
  }

  const period = billingPeriodTimes(data);
  const cd = data.custom_data as Record<string, unknown> | null | undefined;
  const workspaceIdHint =
    typeof cd?.workspaceId === "string" ? cd.workspaceId : undefined;

  await ctx.runMutation(internal.billing.upsertSubscriptionFromPaddle, {
    paddleSubscriptionId: subscriptionId,
    paddleCustomerId: customerId,
    customerEmail: email,
    status: mapPaddleStatus(String(data.status ?? "active")),
    plan: resolvePlan(data),
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    cancelAtPeriodEnd: deriveCancelAtPeriodEnd(data),
    workspaceIdHint,
  });
}

export default http;
