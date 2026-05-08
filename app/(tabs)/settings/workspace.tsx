import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { Building2, Users, Target, Calendar } from 'lucide-react-native';

export default function WorkspaceSettingsScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);

  if (!workspace) {
    return (
      <SafeArea>
        <Header showBack title="Workspace Settings" />
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Header showBack title="Workspace Settings" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Workspace Info */}
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Building2 size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Workspace Name</Text>
              <Text style={styles.infoValue}>{workspace.name}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Users size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Industry</Text>
              <Text style={styles.infoValue}>{workspace.industry}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Users size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Team Size</Text>
              <Text style={styles.infoValue}>{workspace.teamSize} people</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Target size={20} color={colors.primary[500]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Team Type</Text>
              <Text style={styles.infoValue}>{workspace.teamType}</Text>
            </View>
          </View>
        </Card>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Card style={styles.goalsCard}>
            <View style={styles.goalsContainer}>
              {workspace.goals.map((goal, index) => (
                <Badge key={index} label={goal} variant="primary" size="md" style={styles.goalBadge} />
              ))}
            </View>
          </Card>
        </View>

        {/* Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compliance Score</Text>
          <Card style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{workspace.readinessScore}</Text>
            <Text style={styles.scoreLabel}>Readiness Score</Text>
          </Card>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Card style={styles.dangerCard}>
            <Text style={styles.dangerLabel}>Delete Workspace</Text>
            <Text style={styles.dangerDescription}>
              Permanently delete this workspace and all its data. This action cannot be undone.
            </Text>
            <Button
              title="Delete Workspace"
              variant="danger"
              size="sm"
              style={styles.deleteButton}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  goalsCard: {},
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalBadge: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary[500],
  },
  scoreLabel: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    marginTop: spacing.sm,
  },
  dangerZone: {
    marginTop: spacing.xl,
  },
  dangerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.error[600],
    marginBottom: spacing.md,
  },
  dangerCard: {
    borderColor: colors.error[200],
    borderWidth: 1,
  },
  dangerLabel: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  dangerDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
  },
  deleteButton: {
    alignSelf: 'flex-start',
  },
});
