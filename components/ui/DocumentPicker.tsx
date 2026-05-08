import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as DocumentPickerExpo from 'expo-document-picker';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { Upload, FileText, X, Check } from 'lucide-react-native';
import { Id } from '@/convex/_generated/dataModel';

interface DocumentPickerProps {
  workspaceId: Id<"workspaces">;
  workflowStepId?: Id<"workflowSteps">;
  onUploadComplete?: (documentId: Id<"documents">) => void;
  onError?: (error: string) => void;
}

export function DocumentPicker({
  workspaceId,
  workflowStepId,
  onUploadComplete,
  onError,
}: DocumentPickerProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; id: Id<"documents"> } | null>(null);
  
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);
  const createDocument = useMutation(api.documents.create);

  const handlePick = async () => {
    try {
      const result = await DocumentPickerExpo.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file) return;

      setIsUploading(true);

      const uploadUrl = await generateUploadUrl();

      const response = await fetch(file.uri);
      const blob = await response.blob();

      await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': file.mimeType || 'application/octet-stream',
        },
        body: blob,
      });

      const url = new URL(uploadUrl);
      const storageId = url.pathname.split('/').pop() || '';

      const documentId = await createDocument({
        workspaceId,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
        storageId,
        workflowStepId,
      });

      setUploadedFile({ name: file.name, id: documentId });
      onUploadComplete?.(documentId);
    } catch (error) {
      console.error('Upload failed:', error);
      onError?.('Failed to upload document');
      Alert.alert('Upload Failed', 'There was an error uploading your document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
  };

  if (uploadedFile) {
    return (
      <View style={styles.uploadedContainer}>
        <View style={styles.uploadedIcon}>
          <FileText size={24} color={colors.success[500]} />
        </View>
        <View style={styles.uploadedInfo}>
          <Text style={styles.uploadedName} numberOfLines={1}>
            {uploadedFile.name}
          </Text>
          <View style={styles.uploadedStatus}>
            <Check size={14} color={colors.success[500]} />
            <Text style={styles.uploadedStatusText}>Uploaded</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
          <X size={20} color={colors.error[500]} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePick}
      disabled={isUploading}
    >
      {isUploading ? (
        <>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </>
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Upload size={24} color={colors.primary[500]} />
          </View>
          <Text style={styles.title}>Upload Document</Text>
          <Text style={styles.subtitle}>
            Tap to select a file from your device
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? colors.primary[900] : colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  uploadingText: {
    fontSize: fontSize.base,
    color: colors.primary[500],
    marginTop: spacing.md,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: isDark ? colors.success[900] : colors.success[50],
    borderWidth: 1,
    borderColor: isDark ? colors.success[700] : colors.success[200],
  },
  uploadedIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  uploadedInfo: {
    flex: 1,
  },
  uploadedName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  uploadedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadedStatusText: {
    fontSize: fontSize.sm,
    color: isDark ? colors.success[100] : colors.success[600],
    marginLeft: spacing.xs,
  },
  removeButton: {
    padding: spacing.sm,
  },
});
