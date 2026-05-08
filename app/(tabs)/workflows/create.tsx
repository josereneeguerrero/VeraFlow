import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { Check, Plus, Trash2 } from 'lucide-react-native';

interface Step {
  title: string;
  description: string;
  requiresApproval: boolean;
  requiresDocumentation: boolean;
}

export default function CreateWorkflowScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);
  const createWorkflow = useMutation(api.workflows.create);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { title: '', description: '', requiresApproval: false, requiresDocumentation: false },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleCreate = async () => {
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

  return (
    <SafeArea>
      <Header showClose title="Create Workflow" />
      
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
                    {step.requiresApproval && <Check size={14} color={colors.white} />}
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
                    {step.requiresDocumentation && <Check size={14} color={colors.white} />}
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
            icon={<Plus size={18} color={colors.gray[600]} />}
          />
        </View>

        <View style={styles.actions}>
          <Button
            title="Create Workflow"
            onPress={handleCreate}
            loading={loading}
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
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
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
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.lg,
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
    backgroundColor: colors.gray[50],
  },
  optionActive: {
    backgroundColor: colors.primary[50],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[300],
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
    color: colors.gray[700],
  },
  actions: {
    marginTop: spacing.xl,
  },
});
