import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { Check, Crown, Zap, Building2 } from 'lucide-react-native';

export default function BillingScreen() {
  const router = useRouter();
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
            />
            <UsageItem
              label="Active Workflows"
              current={usage?.activeWorkflows || 0}
              limit={currentPlan?.limits?.workflows || 3}
            />
            <UsageItem
              label="Integrations"
              current={usage?.connectedIntegrations || 0}
              limit={currentPlan?.limits?.integrations || 2}
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
                  <View style={[styles.planIcon, { backgroundColor: colors.primary[50] }]}>
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
  limit 
}: { 
  label: string; 
  current: number; 
  limit: number;
}) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;
  
  return (
    <View style={usageStyles.item}>
      <View style={usageStyles.header}>
        <Text style={usageStyles.label}>{label}</Text>
        <Text style={usageStyles.value}>
          {current} / {isUnlimited ? '∞' : limit}
        </Text>
      </View>
      {!isUnlimited && (
        <ProgressBar 
          value={percentage} 
          size="sm" 
          color={percentage > 80 ? colors.warning[500] : colors.primary[500]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  currentPlanCard: {
    backgroundColor: colors.primary[500],
    marginBottom: spacing.xl,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  planLabel: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
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
  },
  renewDate: {
    fontSize: fontSize.sm,
    color: colors.primary[100],
    marginTop: spacing.md,
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
  usageCard: {
    padding: 0,
  },
  planCard: {
    marginBottom: spacing.md,
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
    color: colors.gray[900],
  },
  planCardPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.gray[700],
  },
  planPeriodSmall: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.gray[500],
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
    color: colors.gray[600],
    marginLeft: spacing.sm,
  },
  footer: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },
});

const usageStyles = StyleSheet.create({
  item: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  value: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
});
