import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { Check, Crown, Zap, Building2 } from 'lucide-react-native';

export default function BillingScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const usageStyles = createUsageStyles(colors);
  const workspace = useQuery(api.workspaces.getCurrent);
  const currentPlan = useQuery(
    api.billing.getCurrentPlan,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const usage = useQuery(
    api.billing.getUsage,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const plans = useQuery(api.billing.getPlans);
  const upgrade = useMutation(api.billing.upgrade);

  const [upgrading, setUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!workspace) return;
    setUpgrading(planId);
    try {
      await upgrade({ workspaceId: workspace._id, plan: planId as any });
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter': return Zap;
      case 'professional': return Crown;
      case 'enterprise': return Building2;
      default: return Zap;
    }
  };

  return (
    <SafeArea>
      <Header showBack title="Billing & Plan" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Current Plan */}
        <Card style={styles.currentPlanCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Badge 
              label={currentPlan?.status || 'active'} 
              variant={currentPlan?.status === 'trialing' ? 'warning' : 'success'} 
            />
          </View>
          <Text style={styles.planName}>{currentPlan?.name || 'Starter'}</Text>
          <Text style={styles.planPrice}>
            ${currentPlan?.price || 29}
            <Text style={styles.planPeriod}>/month</Text>
          </Text>
          {currentPlan?.currentPeriodEnd && (
            <Text style={styles.renewDate}>
              {currentPlan.status === 'trialing' ? 'Trial ends' : 'Renews'}{' '}
              {formatDate(currentPlan.currentPeriodEnd)}
            </Text>
          )}
        </Card>

        {/* Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage</Text>
          <Card style={styles.usageCard}>
            <UsageItem
              label="Team Members"
              current={usage?.teamMembers || 0}
              limit={currentPlan?.limits?.teamMembers || 5}
              styles={usageStyles}
              colors={colors}
            />
            <UsageItem
              label="Active Workflows"
              current={usage?.activeWorkflows || 0}
              limit={currentPlan?.limits?.workflows || 3}
              styles={usageStyles}
              colors={colors}
            />
            <UsageItem
              label="Integrations"
              current={usage?.connectedIntegrations || 0}
              limit={currentPlan?.limits?.integrations || 2}
              styles={usageStyles}
              colors={colors}
              isLast
            />
          </Card>
        </View>

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          {plans?.map((plan: any) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrent = currentPlan?.plan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                style={[styles.planCard, isCurrent && styles.planCardCurrent]}
              >
                <View style={styles.planCardHeader}>
                  <View style={[
                    styles.planIcon,
                    { backgroundColor: isDark ? colors.surfaceSecondary : colors.primary[50] }
                  ]}>
                    <Icon size={24} color={colors.primary[500]} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={styles.planCardName}>{plan.name}</Text>
                    <Text style={styles.planCardPrice}>
                      ${plan.price}<Text style={styles.planPeriodSmall}>/mo</Text>
                    </Text>
                  </View>
                  {isCurrent && <Badge label="Current" variant="success" size="sm" />}
                </View>

                <View style={styles.features}>
                  {plan.features.slice(0, 5).map((feature: string, index: number) => (
                    <View key={index} style={styles.featureItem}>
                      <Check size={16} color={colors.success[500]} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrent && (
                  <Button
                    title={plan.price > (currentPlan?.price || 0) ? 'Upgrade' : 'Switch'}
                    onPress={() => handleUpgrade(plan.id)}
                    loading={upgrading === plan.id}
                    variant={plan.id === 'professional' ? 'primary' : 'outline'}
                    fullWidth
                  />
                )}
              </Card>
            );
          })}
        </View>

        <Text style={styles.footer}>
          Need a custom plan? Contact sales@veraflow.com
        </Text>
      </ScrollView>
    </SafeArea>
  );
}

function UsageItem({ 
  label, 
  current, 
  limit,
  styles: usageRowStyles,
  colors: themeColors,
  isLast,
}: { 
  label: string; 
  current: number; 
  limit: number;
  styles: ReturnType<typeof createUsageStyles>;
  colors: ThemeColors;
  isLast?: boolean;
}) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  
  return (
    <View style={[usageRowStyles.item, isLast && usageRowStyles.itemLast]}>
      <View style={usageRowStyles.header}>
        <Text style={usageRowStyles.label}>{label}</Text>
        <Text style={usageRowStyles.value}>
          {current} / {isUnlimited ? '∞' : limit}
        </Text>
      </View>
      {!isUnlimited && (
        <ProgressBar 
          value={percentage} 
          size="sm" 
          color={percentage > 80 ? themeColors.warning[500] : themeColors.primary[500]}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  currentPlanCard: {
    backgroundColor: colors.primary[600],
    marginBottom: spacing.xl,
    borderWidth: isDark ? 1 : 0,
    borderColor: isDark ? colors.primary[400] : 'transparent',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planLabel: {
    fontSize: fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  planName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  planPrice: {
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  planPeriod: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.normal,
    color: 'rgba(255,255,255,0.88)',
  },
  renewDate: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: spacing.md,
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
  usageCard: {
    padding: 0,
  },
  planCard: {
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  planCardCurrent: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planCardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  planCardPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  planPeriodSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.text.secondary,
  },
  features: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

const createUsageStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    item: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    itemLast: {
      borderBottomWidth: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: fontSize.sm,
      color: colors.text.secondary,
    },
    value: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text.primary,
    },
  });
