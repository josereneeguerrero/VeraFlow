import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeArea, Header } from '@/components/layout';
import { Card } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { 
  HelpCircle, MessageCircle, Mail, FileText, 
  ExternalLink, ChevronRight, BookOpen
} from 'lucide-react-native';

export default function HelpScreen() {
  const faqItems = [
    {
      question: 'How do I invite team members?',
      answer: 'Go to Settings > Team Members > Invite and enter their email address.',
    },
    {
      question: 'How is my compliance score calculated?',
      answer: 'Your score is based on completed workflows, documentation status, and assessment results.',
    },
    {
      question: 'Can I customize workflows?',
      answer: 'Yes! Create custom workflows or modify existing templates to fit your needs.',
    },
    {
      question: 'How do integrations work?',
      answer: 'Connect your tools in Settings > Integrations. We sync data automatically.',
    },
  ];

  const supportOptions = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: () => {},
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'support@veraflow.com',
      action: () => Linking.openURL('mailto:support@veraflow.com'),
    },
    {
      icon: BookOpen,
      title: 'Documentation',
      description: 'Browse help articles',
      action: () => Linking.openURL('https://docs.veraflow.com'),
    },
  ];

  return (
    <SafeArea>
      <Header showBack title="Help & Support" />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Support Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get Help</Text>
          {supportOptions.map((option, index) => {
            const Icon = option.icon;
            return (
              <Card key={index} style={styles.supportCard} onPress={option.action}>
                <View style={styles.supportIcon}>
                  <Icon size={24} color={colors.primary[500]} />
                </View>
                <View style={styles.supportInfo}>
                  <Text style={styles.supportTitle}>{option.title}</Text>
                  <Text style={styles.supportDescription}>{option.description}</Text>
                </View>
                <ChevronRight size={20} color={colors.gray[400]} />
              </Card>
            );
          })}
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Card style={styles.faqCard} padding="none">
            {faqItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.faqItem,
                  index < faqItems.length - 1 && styles.faqItemBorder,
                ]}
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.faqAnswer}>{item.answer}</Text>
              </View>
            ))}
          </Card>
        </View>

        {/* Resources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <TouchableOpacity style={styles.resourceLink}>
            <FileText size={20} color={colors.primary[500]} />
            <Text style={styles.resourceText}>Privacy Policy</Text>
            <ExternalLink size={16} color={colors.gray[400]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceLink}>
            <FileText size={20} color={colors.primary[500]} />
            <Text style={styles.resourceText}>Terms of Service</Text>
            <ExternalLink size={16} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>VeraFlow v1.0.0</Text>
      </ScrollView>
    </SafeArea>
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  supportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  supportInfo: {
    flex: 1,
  },
  supportTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  supportDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  faqCard: {
    overflow: 'hidden',
  },
  faqItem: {
    padding: spacing.lg,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  faqQuestion: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  faqAnswer: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  resourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  resourceText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.gray[900],
    marginLeft: spacing.md,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
