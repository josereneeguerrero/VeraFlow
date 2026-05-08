import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, PageHeader } from '@/components/layout';
import { Card, Button, Input, Select } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';

function parseOptionalIsoDate(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return NaN;
  const ms = new Date(`${trimmed}T12:00:00`).getTime();
  return Number.isNaN(ms) ? NaN : ms;
}

export default function CreatePolicyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const workspace = useQuery(api.workspaces.getCurrent);
  const categories = useQuery(api.policies.getCategories);
  const createPolicy = useMutation(api.policies.create);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [effectiveDateStr, setEffectiveDateStr] = useState('');
  const [nextReviewDateStr, setNextReviewDateStr] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!workspace) return;

    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a policy name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a policy description');
      return;
    }
    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const effectiveMs = parseOptionalIsoDate(effectiveDateStr);
    const reviewMs = parseOptionalIsoDate(nextReviewDateStr);
    if (Number.isNaN(effectiveMs) || Number.isNaN(reviewMs)) {
      Alert.alert(
        'Invalid date',
        'Use optional dates in YYYY-MM-DD format, or leave them blank.'
      );
      return;
    }

    setSaving(true);
    try {
      const policyId = await createPolicy({
        workspaceId: workspace._id,
        name: name.trim(),
        description: description.trim(),
        category,
        content: content.trim() || undefined,
        effectiveDate: effectiveMs,
        nextReviewDate: reviewMs,
      });

      Alert.alert('Success', 'Policy created successfully', [
        { text: 'OK', onPress: () => router.push(`/(tabs)/policies/${policyId}`) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create policy');
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = (categories || []).map((cat) => ({
    label: cat,
    value: cat,
  }));

  return (
    <SafeArea>
      <PageHeader title="Create Policy" showBack />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Policy Details</Text>

          <Input
            label="Policy Name"
            placeholder="e.g., HIPAA Privacy Policy"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Description"
            placeholder="Brief description of this policy"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Category</Text>
            <Select
              options={categoryOptions}
              value={category}
              onChange={setCategory}
              placeholder="Select category"
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Policy Content</Text>
          <Text style={styles.helperText}>
            Enter the full policy text below or upload a document later.
          </Text>
          <TextInput
            style={styles.contentInput}
            placeholder="Enter policy content..."
            placeholderTextColor={colors.text.tertiary}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Dates</Text>
          <Text style={styles.helperText}>
            Optional. Use YYYY-MM-DD (example: 2026-05-08).
          </Text>

          <Input
            label="Effective Date"
            placeholder="YYYY-MM-DD"
            value={effectiveDateStr}
            onChangeText={setEffectiveDateStr}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Next Review Date"
            placeholder="YYYY-MM-DD"
            value={nextReviewDateStr}
            onChangeText={setNextReviewDateStr}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title="Create Policy"
            onPress={handleSave}
            loading={saving}
            fullWidth
          />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            fullWidth
            style={styles.cancelButton}
          />
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  contentInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.text.primary,
    minHeight: 200,
  },
  actions: {
    marginTop: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
});
