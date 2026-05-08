import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input, Badge } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Check, Plus, Trash2, FileText, Edit3, ChevronRight, Clock, Users } from 'lucide-react-native';
import { Id } from '@/convex/_generated/dataModel';

type CreateMode = 'choose' | 'template' | 'custom';

interface Step {
  title: string;
  description: string;
  requiresApproval: boolean;
  requiresDocumentation: boolean;
}

export default function CreateWorkflowScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  
  const workspace = useQuery(api.workspaces.getCurrent);
  const templates = useQuery(api.workflowTemplates.list);
  const createWorkflow = useMutation(api.workflows.create);
  const createFromTemplate = useMutation(api.workflowTemplates.createFromTemplate);
  
  const [mode, setMode] = useState<CreateMode>('choose');
  const [selectedTemplate, setSelectedTemplate] = useState<Id<"workflowTemplates"> | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { title: '', description: '', requiresApproval: false, requiresDocumentation: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTemplateData = templates?.find((t) => t._id === selectedTemplate);

  const addStep = () => {
    setSteps([
      ...steps,
      { title: '', description: '', requiresApproval: false, requiresDocumentation: false },
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleCreateFromTemplate = async () => {
    if (!workspace || !selectedTemplate) return;

    setLoading(true);
    setError('');
    try {
      const workflowId = await createFromTemplate({
        templateId: selectedTemplate,
        workspaceId: workspace._id,
        name: name.trim() || undefined,
      });

      router.replace(`/(tabs)/workflows/${workflowId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustom = async () => {
    setError('');

    if (!name.trim()) {
      setError('Please enter a workflow name');
      return;
    }

    const validSteps = steps.filter((s) => s.title.trim());
    if (validSteps.length === 0) {
      setError('Please add at least one step');
      return;
    }

    if (!workspace) return;

    setLoading(true);
    try {
      const workflowId = await createWorkflow({
        workspaceId: workspace._id,
        name: name.trim(),
        description: description.trim(),
        steps: validSteps,
      });

      router.replace(`/(tabs)/workflows/${workflowId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create workflow');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'choose') {
    return (
      <SafeArea>
        <Header showClose title="Create Workflow" />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.pageTitle}>How would you like to start?</Text>
          <Text style={styles.pageSubtitle}>
            Choose from a template or create a custom workflow from scratch.
          </Text>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setMode('template')}
          >
            <View style={styles.modeIconContainer}>
              <FileText size={28} color={colors.primary[500]} />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>From Template</Text>
              <Text style={styles.modeDescription}>
                Start with a pre-built compliance workflow template
              </Text>
            </View>
            <ChevronRight size={24} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeCard}
            onPress={() => setMode('custom')}
          >
            <View style={[styles.modeIconContainer, styles.modeIconSecondary]}>
              <Edit3 size={28} color={colors.warning[500]} />
            </View>
            <View style={styles.modeContent}>
              <Text style={styles.modeTitle}>Custom Workflow</Text>
              <Text style={styles.modeDescription}>
                Build your own workflow with custom steps
              </Text>
            </View>
            <ChevronRight size={24} color={colors.text.tertiary} />
          </TouchableOpacity>
        </ScrollView>
      </SafeArea>
    );
  }

  if (mode === 'template') {
    if (selectedTemplate && selectedTemplateData) {
      return (
        <SafeArea>
          <Header 
            showBack 
            title="Create from Template" 
            onBack={() => setSelectedTemplate(null)}
          />
          
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Card style={styles.templatePreview}>
              <Badge label={selectedTemplateData.category} variant="primary" size="sm" />
              <Text style={styles.templatePreviewTitle}>{selectedTemplateData.name}</Text>
              <Text style={styles.templatePreviewDescription}>
                {selectedTemplateData.description}
              </Text>
              
              <View style={styles.templateMeta}>
                <View style={styles.templateMetaItem}>
                  <Clock size={16} color={colors.text.secondary} />
                  <Text style={styles.templateMetaText}>
                    {selectedTemplateData.estimatedDuration}
                  </Text>
                </View>
                <View style={styles.templateMetaItem}>
                  <Users size={16} color={colors.text.secondary} />
                  <Text style={styles.templateMetaText}>
                    {selectedTemplateData.steps.length} steps
                  </Text>
                </View>
              </View>
            </Card>

            <View style={styles.section}>
              <Input
                label="Workflow Name (Optional)"
                placeholder={selectedTemplateData.name}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Steps Preview</Text>
              {selectedTemplateData.steps.map((step, index) => (
                <View key={index} style={styles.stepPreview}>
                  <View style={styles.stepPreviewNumber}>
                    <Text style={styles.stepPreviewNumberText}>{step.order}</Text>
                  </View>
                  <View style={styles.stepPreviewContent}>
                    <Text style={styles.stepPreviewTitle}>{step.title}</Text>
                    <Text style={styles.stepPreviewDescription} numberOfLines={1}>
                      {step.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Button
                title="Create Workflow"
                onPress={handleCreateFromTemplate}
                loading={loading}
                fullWidth
                size="lg"
              />
            </View>
          </ScrollView>
        </SafeArea>
      );
    }

    return (
      <SafeArea>
        <Header 
          showBack 
          title="Choose Template" 
          onBack={() => setMode('choose')}
        />
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>Available Templates</Text>
          <Text style={styles.sectionSubtitle}>
            Select a template to preview and customize
          </Text>

          {templates?.map((template) => (
            <TouchableOpacity
              key={template._id}
              style={styles.templateCard}
              onPress={() => setSelectedTemplate(template._id)}
            >
              <View style={styles.templateHeader}>
                <Badge 
                  label={template.category} 
                  variant={template.priority === 'critical' ? 'error' : template.priority === 'high' ? 'warning' : 'primary'} 
                  size="sm" 
                />
                <Badge 
                  label={`${template.steps.length} steps`} 
                  variant="default" 
                  size="sm" 
                />
              </View>
              <Text style={styles.templateTitle}>{template.name}</Text>
              <Text style={styles.templateDescription} numberOfLines={2}>
                {template.description}
              </Text>
              <View style={styles.templateFooter}>
                <View style={styles.templateDuration}>
                  <Clock size={14} color={colors.text.tertiary} />
                  <Text style={styles.templateDurationText}>
                    {template.estimatedDuration}
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <Header 
        showBack 
        title="Custom Workflow" 
        onBack={() => setMode('choose')}
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Input
            label="Workflow Name"
            placeholder="e.g., HIPAA Training Completion"
            value={name}
            onChangeText={setName}
          />
          
          <Input
            label="Description"
            placeholder="Describe what this workflow accomplishes"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps</Text>
          <Text style={styles.sectionSubtitle}>
            Add the steps required to complete this workflow
          </Text>

          {steps.map((step, index) => (
            <Card key={index} style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                {steps.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeStep(index)}
                    style={styles.removeButton}
                  >
                    <Trash2 size={18} color={colors.error[500]} />
                  </TouchableOpacity>
                )}
              </View>

              <Input
                label="Step Title"
                placeholder="e.g., Complete training module"
                value={step.title}
                onChangeText={(text) => updateStep(index, 'title', text)}
                containerStyle={styles.stepInput}
              />

              <Input
                label="Description"
                placeholder="What needs to be done in this step?"
                value={step.description}
                onChangeText={(text) => updateStep(index, 'description', text)}
                multiline
                containerStyle={styles.stepInput}
              />

              <View style={styles.stepOptions}>
                <TouchableOpacity
                  style={[
                    styles.option,
                    step.requiresApproval && styles.optionActive,
                  ]}
                  onPress={() => updateStep(index, 'requiresApproval', !step.requiresApproval)}
                >
                  <View style={[
                    styles.checkbox,
                    step.requiresApproval && styles.checkboxActive,
                  ]}>
                    {step.requiresApproval && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.optionText}>Requires Approval</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.option,
                    step.requiresDocumentation && styles.optionActive,
                  ]}
                  onPress={() => updateStep(index, 'requiresDocumentation', !step.requiresDocumentation)}
                >
                  <View style={[
                    styles.checkbox,
                    step.requiresDocumentation && styles.checkboxActive,
                  ]}>
                    {step.requiresDocumentation && <Check size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.optionText}>Requires Documentation</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))}

          <Button
            title="Add Step"
            onPress={addStep}
            variant="outline"
            fullWidth
            icon={<Plus size={18} color={colors.text.secondary} />}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Create Workflow"
            onPress={handleCreateCustom}
            loading={loading}
            fullWidth
            size="lg"
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  pageTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  modeIconSecondary: {
    backgroundColor: colors.warning[50],
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  modeDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.error[700],
    fontSize: fontSize.sm,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  templateCard: {
    padding: spacing.lg,
    backgroundColor: colors.card.background,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.card.border,
  },
  templateHeader: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  templateTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  templateDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateDuration: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateDurationText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  templatePreview: {
    marginBottom: spacing.xl,
  },
  templatePreviewTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  templatePreviewDescription: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  templateMeta: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  templateMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  templateMetaText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  stepPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepPreviewNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepPreviewNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  stepPreviewContent: {
    flex: 1,
  },
  stepPreviewTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  stepPreviewDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  stepCard: {
    marginBottom: spacing.md,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary[700],
  },
  removeButton: {
    padding: spacing.sm,
  },
  stepInput: {
    marginBottom: spacing.md,
  },
  stepOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  optionActive: {
    backgroundColor: colors.primary[50],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  optionText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  actions: {
    marginTop: spacing.xl,
  },
});
