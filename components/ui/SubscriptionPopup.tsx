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
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useTheme, useThemeColors, ThemeColors } from '@/lib/theme';
import { Button } from './Button';
import { Card } from './Card';
import { Check, X, Zap, Crown, Building2, Sparkles } from 'lucide-react-native';

const POLAR_CHECKOUT_URLS = {
  starter: 'https://buy.polar.sh/polar_cl_Qtjc97ubZBq1csbnEfXarKXlJqK4K4hXDQV6z0yMUiZ',
  professional: 'https://buy.polar.sh/polar_cl_vnIWQfLDvu6YhDhXBKrADFjv754ViPneOvKSH3z7Xmx',
  enterprise: 'https://buy.polar.sh/polar_cl_IYULmfxKyw5mU5EURW9olA5LTK1kv5RcF9ehr22PzoI',
} as const;

type PlanId = keyof typeof POLAR_CHECKOUT_URLS;

interface SubscriptionPopupProps {
  visible: boolean;
  onClose: () => void;
  onSubscriptionComplete: () => void;
  userEmail?: string;
}

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    price: 29,
    icon: Zap,
    popular: false,
    features: [
      'Up to 5 team members',
      '3 active workflows',
      'Basic integrations',
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
      'Up to 25 team members',
      'Unlimited workflows',
      'All integrations',
      'Priority support',
      'Advanced reports',
      'Custom workflows',
      'Approval chains',
    ],
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    price: 499,
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
    ],
  },
];

export function SubscriptionPopup({
  visible,
  onClose,
  onSubscriptionComplete,
  userEmail,
}: SubscriptionPopupProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const styles = createStyles(colors, isDark);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('professional');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
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

  const checkoutUrl = (() => {
    const baseUrl = POLAR_CHECKOUT_URLS[selectedPlan];
    if (!userEmail) return baseUrl;
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}customer_email=${encodeURIComponent(userEmail)}`;
  })();

  const handleStartTrial = () => {
    setCheckoutLoading(true);
    setCheckoutVisible(true);
  };

  const handleCloseMain = () => {
    setCheckoutVisible(false);
    onClose();
  };

  const handleCloseCheckout = () => {
    setCheckoutVisible(false);
    setCheckoutLoading(false);
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
                : selectedPlan === 'starter'
                  ? 'Complete checkout to start your 14-day free trial.'
                  : 'Complete checkout to activate your subscription.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={handleCloseCheckout}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <WebView
          style={styles.webView}
          source={{ uri: checkoutUrl }}
          onLoadEnd={() => setCheckoutLoading(false)}
          onError={(event) => {
            console.error('Polar checkout failed to load', event.nativeEvent);
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
                14-day free trial available on Starter plan. No credit card required.
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
                          <Text style={styles.trialBadgeText}>14-day free trial</Text>
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
              <Text style={styles.benefitsTitle}>
                {selectedPlan === 'starter' ? "What's included in your trial:" : "What's included:"}
              </Text>
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
              title={selectedPlan === 'starter' ? 'Start 14-day free trial' : 'Subscribe now'}
              onPress={handleStartTrial}
              fullWidth
              size="lg"
            />
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
