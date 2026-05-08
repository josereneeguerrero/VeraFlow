import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react-native';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'center';
}

interface OnboardingTourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  steps: TourStep[];
}

const OnboardingTourContext = createContext<OnboardingTourContextType | undefined>(undefined);

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VeraFlow!',
    description: 'Your healthcare compliance assistant. Let\'s take a quick tour to help you get started with the key features.',
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Compliance Dashboard',
    description: 'See your overall compliance score, track progress, and identify areas that need attention at a glance.',
    target: 'dashboard',
    position: 'bottom',
  },
  {
    id: 'workflows',
    title: 'Guided Workflows',
    description: 'Create and manage compliance workflows with step-by-step guidance. Use our pre-built HIPAA templates to get started quickly.',
    target: 'workflows',
    position: 'bottom',
  },
  {
    id: 'recommendations',
    title: 'AI-Powered Recommendations',
    description: 'Get intelligent suggestions on how to improve your compliance posture based on your current status and industry best practices.',
    target: 'recommendations',
    position: 'bottom',
  },
  {
    id: 'policies',
    title: 'Policy Management',
    description: 'Store, version, and track acknowledgment of your compliance policies. Keep your team up to date with the latest requirements.',
    target: 'policies',
    position: 'top',
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Configure integrations, manage team members, set up notifications, and adjust your preferences in Settings.',
    target: 'settings',
    position: 'top',
  },
  {
    id: 'security',
    title: 'Secure Your Account',
    description: 'For HIPAA compliance, we recommend enabling two-factor authentication in Security settings to protect sensitive healthcare data.',
    position: 'center',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start by creating your first workflow using one of our HIPAA templates. We\'re here to help you achieve compliance excellence.',
    position: 'center',
  },
];

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  const user = useQuery(api.users.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const endTour = useCallback(async () => {
    setIsActive(false);
    setCurrentStep(0);
    try {
      await updateProfile({ onboardingCompleted: true });
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
    }
  }, [updateProfile]);

  const nextStep = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStep, endTour]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const contextValue: OnboardingTourContextType = {
    isActive,
    currentStep,
    startTour,
    endTour,
    nextStep,
    prevStep,
    skipTour,
    steps: tourSteps,
  };

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <OnboardingTourContext.Provider value={contextValue}>
      {children}
      
      <Modal
        visible={isActive}
        transparent
        animationType="fade"
        onRequestClose={skipTour}
      >
        <View style={styles.overlay}>
          <View style={styles.container}>
            <View style={styles.card}>
              <TouchableOpacity style={styles.closeButton} onPress={skipTour}>
                <X size={20} color={colors.text.tertiary} />
              </TouchableOpacity>

              <View style={styles.stepIndicator}>
                {tourSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.stepDot,
                      index === currentStep && styles.stepDotActive,
                      index < currentStep && styles.stepDotCompleted,
                    ]}
                  />
                ))}
              </View>

              <Text style={styles.title}>{step.title}</Text>
              <Text style={styles.description}>{step.description}</Text>

              <View style={styles.actions}>
                {!isFirstStep && (
                  <TouchableOpacity style={styles.backButton} onPress={prevStep}>
                    <ChevronLeft size={18} color={colors.text.secondary} />
                    <Text style={styles.backButtonText}>Back</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.rightActions}>
                  {!isLastStep && (
                    <TouchableOpacity style={styles.skipButton} onPress={skipTour}>
                      <Text style={styles.skipButtonText}>Skip Tour</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
                    <Text style={styles.nextButtonText}>
                      {isLastStep ? 'Get Started' : 'Next'}
                    </Text>
                    {isLastStep ? (
                      <Check size={18} color={colors.white} />
                    ) : (
                      <ChevronRight size={18} color={colors.white} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <Text style={styles.progress}>
              {currentStep + 1} of {tourSteps.length}
            </Text>
          </View>
        </View>
      </Modal>
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error('useOnboardingTour must be used within OnboardingTourProvider');
  }
  return context;
}

export function TourTriggerButton() {
  const colors = useThemeColors();
  const { startTour } = useOnboardingTour();

  return (
    <TouchableOpacity
      style={{
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.primary[500],
        borderRadius: borderRadius.md,
      }}
      onPress={startTour}
    >
      <Text
        style={{
          color: colors.white,
          fontSize: fontSize.sm,
          fontWeight: fontWeight.medium,
        }}
      >
        Take a Tour
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.xs,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },
  stepDotActive: {
    width: 24,
    backgroundColor: colors.primary[500],
  },
  stepDotCompleted: {
    backgroundColor: colors.success[500],
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginLeft: 'auto',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  skipButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  skipButtonText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  nextButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  progress: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginTop: spacing.lg,
    opacity: 0.8,
  },
});
