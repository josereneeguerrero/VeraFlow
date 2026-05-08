import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea } from '@/components/layout';
import { Header } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useOnboardingStore } from '@/lib/store';
import { api } from '@/convex/_generated/api';
import { Check } from 'lucide-react-native';

export default function AssessmentScreen() {
  const router = useRouter();
  const { assessmentResponses, setAssessmentResponse, setStep } = useOnboardingStore();
  const questions = useQuery(api.assessments.getQuestions);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(assessmentResponses);

  if (!questions) {
    return (
      <SafeArea>
        <Header showBack title="Assessment" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeArea>
    );
  }

  const question = questions[currentQuestion];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const selectedAnswer = answers[question.id];

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);
    setAssessmentResponse(question.id, value);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setStep(5);
      router.push('/(onboarding)/assessment-results');
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const overallProgress = 56 + (progress / 100) * 14;

  return (
    <SafeArea>
      <Header 
        showBack 
        title="Assessment"
        onBack={currentQuestion > 0 ? handleBack : undefined}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.progress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>Step 5 of 7</Text>
        </View>

        <View style={styles.questionHeader}>
          <Text style={styles.questionCount}>
            Question {currentQuestion + 1} of {totalQuestions}
          </Text>
          <View style={styles.questionProgress}>
            {questions.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentQuestion && styles.progressDotActive,
                  index < currentQuestion && styles.progressDotComplete,
                ]}
              />
            ))}
          </View>
        </View>

        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.options}>
          {question.options.map((option: { value: string; label: string; score: number }) => {
            const isSelected = selectedAnswer === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                ]}
                onPress={() => handleSelect(option.value)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                ]}>
                  {isSelected && <Check size={14} color={colors.white} />}
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            title={isLastQuestion ? 'Complete Assessment' : 'Next Question'}
            onPress={handleNext}
            disabled={!selectedAnswer}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.gray[500],
  },
  progress: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.gray[100],
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 2,
  },
  progressText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  questionHeader: {
    marginBottom: spacing.xl,
  },
  questionCount: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.medium,
    marginBottom: spacing.md,
  },
  questionProgress: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[200],
  },
  progressDotActive: {
    backgroundColor: colors.primary[200],
  },
  progressDotComplete: {
    backgroundColor: colors.primary[500],
  },
  question: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing['2xl'],
    lineHeight: 28,
  },
  options: {
    marginBottom: spacing.xl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: spacing.md,
  },
  optionCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  radioSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  optionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[700],
  },
  optionTextSelected: {
    color: colors.primary[700],
    fontWeight: fontWeight.medium,
  },
  actions: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
