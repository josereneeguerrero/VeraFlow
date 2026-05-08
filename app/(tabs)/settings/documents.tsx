import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, EmptyState, Badge } from '@/components/ui';
import { DocumentPicker } from '@/components/ui/DocumentPicker';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatRelativeTime } from '@/lib/utils';
import { FileText, Download, Trash2, Image, File, FileSpreadsheet, Film, Music } from 'lucide-react-native';
import { Id } from '@/convex/_generated/dataModel';
import * as Linking from 'expo-linking';

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('video/')) return Film;
  if (type.startsWith('audio/')) return Music;
  if (type.includes('spreadsheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.includes('pdf') || type.includes('document')) return FileText;
  return File;
};

export default function DocumentsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const documents = useQuery(
    api.documents.list,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const documentStats = useQuery(
    api.documents.getDocumentStats,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const removeDocument = useMutation(api.documents.remove);

  const [refreshing, setRefreshing] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDelete = (docId: Id<"documents">, docName: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${docName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeDocument({ id: docId });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleDownload = (url: string | null) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <SafeArea>
      <Header showBack title="Documents" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats */}
        {documentStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{documentStats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{documentStats.recentUploads}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
          </View>
        )}

        {/* Upload Section */}
        <View style={styles.section}>
          {showUploader ? (
            <View style={styles.uploaderContainer}>
              {workspace && (
                <DocumentPicker
                  workspaceId={workspace._id}
                  onUploadComplete={() => {
                    setShowUploader(false);
                  }}
                />
              )}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUploader(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowUploader(true)}
            >
              <FileText size={20} color={colors.primary[500]} />
              <Text style={styles.uploadButtonText}>Upload New Document</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Document List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Documents</Text>

          {documents && documents.length > 0 ? (
            documents.map((doc) => {
              const FileIcon = getFileIcon(doc.type);
              return (
                <Card key={doc._id} style={styles.documentCard}>
                  <View style={styles.documentHeader}>
                    <View style={styles.documentIcon}>
                      <FileIcon size={24} color={colors.primary[500]} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.documentMeta}>
                        {doc.uploaderName} • {formatRelativeTime(doc.uploadedAt)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.documentActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDownload(doc.url)}
                    >
                      <Download size={18} color={colors.primary[500]} />
                      <Text style={styles.actionText}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(doc._id, doc.name)}
                    >
                      <Trash2 size={18} color={colors.error[500]} />
                      <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          ) : (
            <EmptyState
              icon={<FileText size={48} color={colors.text.tertiary} />}
              title="No documents yet"
              description="Upload your first document to get started with documentation tracking."
            />
          )}
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  uploaderContainer: {
    gap: spacing.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  uploadButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary[500],
    marginLeft: spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    padding: spacing.md,
  },
  cancelButtonText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  documentCard: {
    marginBottom: spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  documentMeta: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  documentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.primary[500],
    marginLeft: spacing.xs,
  },
  deleteText: {
    color: colors.error[500],
  },
});
