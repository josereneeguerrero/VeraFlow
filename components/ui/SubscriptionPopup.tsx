import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Check, X, Zap, Crown, Building2, Sparkles } from 'lucide-react-native';

type PaidPlanId = 'starter' | 'professional' | 'enterprise';

interface SubscriptionPopupProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionComplete: () => void;
  userEmail?: string;
  workspaceId?: Id<'workspaces'>;
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 49,
    icon: Zap,
    popular: false,
    features: [
      'Up to 10 team members',
      '10 active workflows',
      '5 integrations',
      'AI recommendations',
      'Email support',
      'Basic reports',
    ],
  },
  {
    id: 'professional' as const,
    name: 'Professional',
    price: 149,
    icon: Crown,
    popular: true,
    features: [
      'Up to 50 team members',
      'Unlimited workflows',
      'All integrations',
      'Advanced AI insights',
      'Priority support',
      'Full reporting suite',
      'Audit readiness tools',
      'Custom workflow templates',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 399,
    icon: Building2,
    popular: false,
    features: [
      'Unlimited team members',
      'Unlimited workflows',
      'All integrations',
      'Dedicated support',
      'Custom reports',
      'Multi-workspace',
      'SSO & SAML',
      'Audit logs',
      'API access',
      'BAA included',
    ],
  },
];

export function SubscriptionPopup({
  visible,
  onClose,
  onSubscriptionComplete,
  userEmail,
  workspaceId,
}: SubscriptionPopupProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const createPaddleCheckout = useAction(api.billing.createPaddleCheckout);
  const [selectedPlan, setSelectedPlan] = useState<PaidPlanId>('professional');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paddleCheckoutUrl, setPaddleCheckoutUrl] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const handledSubscriptionRef = useRef(false);

  const subscription = useQuery(
    api.billing.getSubscriptionByEmail,
    visible && userEmail ? { email: userEmail } : 'skip'
  );

  useEffect(() => {
    if (!visible) {
      handledSubscriptionRef.current = false;
      setCheckoutVisible(false);
      setCheckoutLoading(false);
      setPaddleCheckoutUrl(null);
      setCheckoutError(null);
      return;
    }

    if (
      subscription &&
      (subscription.status === 'active' || subscription.status === 'trialing') &&
      !handledSubscriptionRef.current
    ) {
      handledSubscriptionRef.current = true;
      setCheckoutVisible(false);
      onSubscriptionComplete();
    }
  }, [visible, subscription, onSubscriptionComplete]);

  const handleStartCheckout = async () => {
    setCheckoutError(null);
    if (!workspaceId) {
      setCheckoutError('Workspace not ready. Finish onboarding or open billing from Settings.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await createPaddleCheckout({
        workspaceId,
        plan: selectedPlan,
      });
      if (!result.success) {
        setCheckoutError(result.error);
        return;
      }
      setPaddleCheckoutUrl(result.checkoutUrl);
      setCheckoutVisible(true);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCloseMain = () => {
    setCheckoutVisible(false);
    setPaddleCheckoutUrl(null);
    onClose();
  };

  const handleCloseCheckout = () => {
    setCheckoutVisible(false);
    setCheckoutLoading(false);
    setPaddleCheckoutUrl(null);
  };

  const handleCheckoutSuccessCheck = () => {
    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      handledSubscriptionRef.current = true;
      handleCloseCheckout();
      onSubscriptionComplete();
    }
  };

  const renderCheckoutModal = () => (
    <Modal
      visible={checkoutVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleCloseCheckout}
    >
      <View style={styles.checkoutContainer}>
        <View style={styles.checkoutHeader}>
          <View style={styles.checkoutHeaderText}>
            <Text style={styles.checkoutTitle}>
              {selectedPlan === 'starter'
                ? 'Starter checkout'
                : selectedPlan === 'professional'
                  ? 'Professional checkout'
                  : 'Enterprise checkout'}
            </Text>
            <Text style={styles.checkoutSubtitle}>
              {subscription?.status === 'active' || subscription?.status === 'trialing'
                ? 'Subscription active, taking you to the dashboard.'
                : 'Secure checkout powered by Paddle. Complete payment to activate your plan.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseCheckout}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {paddleCheckoutUrl ? (
          <WebView
            style={styles.webView}
            source={{ uri: paddleCheckoutUrl }}
            onLoadEnd={() => setCheckoutLoading(false)}
            onError={(event) => {
              console.error('Paddle checkout failed to load', event.nativeEvent);
              setCheckoutLoading(false);
            }}
            onNavigationStateChange={(navState) => {
              if (
                navState.url.includes('success') ||
                navState.url.includes('thank-you') ||
                navState.url.includes('complete')
              ) {
                handleCheckoutSuccessCheck();
              }
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary[500]} />
                <Text style={styles.checkoutLoadingText}>Loading checkout...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.webViewLoading}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.checkoutLoadingText}>Preparing checkout...</Text>
          </View>
        )}
      </View>
    </Modal>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseMain}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <Sparkles size={24} color={colors.primary[500]} />
              </View>
              <Text style={styles.title}>Choose Your Plan</Text>
              <Text style={styles.subtitle}>
                Paid plans bill securely through Paddle. Trials and promotions follow your catalog setup in Paddle.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseMain}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.plansContainer}>
              {plans.map((plan) => {
                const Icon = plan.icon;
                const isSelected = selectedPlan === plan.id;

                return (
                  <TouchableOpacity
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    activeOpacity={0.8}
                  >
                    <Card
                      style={[
                        styles.planCard,
                        plan.popular && !isSelected && styles.planCardPopular,
                        isSelected && styles.planCardSelected,
                        (plan.id === 'starter' || plan.popular) && styles.planCardWithBadge,
                      ]}
                    >
                      {plan.id === 'starter' && (
                        <View style={styles.trialBadge}>
                          <Text style={styles.trialBadgeText}>Optional trial</Text>
                        </View>
                      )}
                      {plan.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>Most Popular</Text>
                        </View>
                      )}

                      <View style={styles.planHeader}>
                        <View
                          style={[
                            styles.planIcon,
                            isSelected && styles.planIconSelected,
                          ]}
                        >
                          <Icon
                            size={20}
                            color={isSelected ? colors.white : colors.primary[500]}
                          />
                        </View>
                        <View style={styles.planInfo}>
                          <Text style={styles.planName}>{plan.name}</Text>
                          <Text style={styles.planPrice}>
                            ${plan.price}
                            <Text style={styles.planPeriod}>/month</Text>
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && styles.radioOuterSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>

                      <View style={styles.features}>
                        {plan.features.slice(0, 4).map((feature, index) => (
                          <View key={index} style={styles.featureItem}>
                            <Check size={14} color={colors.success[500]} />
                            <Text style={styles.featureText}>{feature}</Text>
                          </View>
                        ))}
                        {plan.features.length > 4 && (
                          <Text style={styles.moreFeatures}>
                            +{plan.features.length - 4} more features
                          </Text>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>What&apos;s included:</Text>
              <View style={styles.benefitsList}>
                <BenefitItem colors={colors} text="Full access to all features" />
                <BenefitItem colors={colors} text="Unlimited compliance workflows" />
                <BenefitItem colors={colors} text="AI-powered recommendations" />
                <BenefitItem colors={colors} text="Team collaboration tools" />
                <BenefitItem colors={colors} text="Cancel anytime, no questions asked" />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Continue to checkout"
              onPress={() => {
                void handleStartCheckout();
              }}
              loading={checkoutLoading}
              fullWidth
              size="lg"
            />
            {checkoutError ? (
              <Text style={styles.checkoutError}>{checkoutError}</Text>
            ) : null}
            <TouchableOpacity onPress={handleCloseMain} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </Modal>

      {renderCheckoutModal()}
    </>
  );
}

function BenefitItem({ text, colors }: { text: string; colors: ThemeColors }) {
  const styles = createBenefitStyles(colors);

  return (
    <View style={styles.benefitItem}>
      <Check size={16} color={colors.success[500]} />
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  checkoutContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkoutHeaderText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  checkoutTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  checkoutSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  checkoutLoadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? spacing['3xl'] : spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: isDark ? colors.primary[900] : colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: -spacing.sm,
    marginTop: -spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  plansContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  planCard: {
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  planCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  planCardPopular: {
    borderWidth: 2,
    borderColor: isDark ? colors.primary[400] : colors.primary[200],
  },
  planCardWithBadge: {
    paddingTop: spacing['2xl'],
  },
  trialBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomRightRadius: borderRadius.md,
  },
  trialBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomLeftRadius: borderRadius.md,
  },
  popularText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: isDark ? colors.surfaceSecondary : colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  planIconSelected: {
    backgroundColor: colors.primary[500],
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  planPrice: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  planPeriod: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.normal,
    color: colors.text.secondary,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  features: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  moreFeatures: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  benefitsSection: {
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitsTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  benefitsList: {
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? spacing['2xl'] : spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card.background,
  },
  footerText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  checkoutError: {
    fontSize: fontSize.sm,
    color: colors.error[500],
    textAlign: 'center',
    marginTop: spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

const createBenefitStyles = (colors: ThemeColors) => StyleSheet.create({
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  benefitText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});
