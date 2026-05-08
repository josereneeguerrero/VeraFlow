import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { Card, Button, Input, Avatar, Badge, EmptyState } from '@/components/ui';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { api } from '@/convex/_generated/api';
import { formatDate } from '@/lib/utils';
import { 
  Users, Plus, Mail, Shield, Clock, 
  MoreVertical, UserPlus, X
} from 'lucide-react-native';

export default function TeamScreen() {
  const router = useRouter();
  const workspace = useQuery(api.workspaces.getCurrent);
  const members = useQuery(
    api.workspaces.getMembers,
    workspace ? { workspaceId: workspace._id } : 'skip'
  );
  const inviteMember = useMutation(api.workspaces.inviteMember);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [inviteLoading, setInviteLoading] = useState(false);

  const activeMembers = members?.filter(m => m.status === 'active') || [];
  const pendingMembers = members?.filter(m => m.status === 'pending') || [];

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !workspace) return;
    
    setInviteLoading(true);
    try {
      await inviteMember({
        workspaceId: workspace._id,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Failed to invite:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner': return 'primary';
      case 'admin': return 'warning';
      default: return 'default';
    }
  };

  return (
    <SafeArea>
      <Header 
        showBack 
        title="Team Members"
        rightAction={
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowInviteModal(true)}
          >
            <Plus size={20} color={colors.primary[500]} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeMembers.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{pendingMembers.length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Active Members */}
        {activeMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Members</Text>
            {activeMembers.map((member: any) => (
              <Card key={member._id} style={styles.memberCard}>
                <Avatar name={member.profile?.name} size="md" />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.profile?.name || 'Team Member'}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {member.profile?.email || member.email}
                  </Text>
                </View>
                <Badge 
                  label={member.role} 
                  variant={getRoleBadgeVariant(member.role)} 
                  size="sm" 
                />
              </Card>
            ))}
          </View>
        )}

        {/* Pending Invites */}
        {pendingMembers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Invitations</Text>
            {pendingMembers.map((member: any) => (
              <Card key={member._id} style={styles.memberCard}>
                <View style={styles.pendingIcon}>
                  <Clock size={20} color={colors.warning[500]} />
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  <Text style={styles.inviteDate}>
                    Invited {formatDate(member.invitedAt)}
                  </Text>
                </View>
                <Badge label="Pending" variant="warning" size="sm" />
              </Card>
            ))}
          </View>
        )}

        {/* Empty State */}
        {members?.length === 0 && (
          <EmptyState
            icon={<Users size={48} color={colors.gray[300]} />}
            title="No team members yet"
            description="Invite your team to collaborate on compliance workflows"
            actionLabel="Invite Team Member"
            onAction={() => setShowInviteModal(true)}
          />
        )}

        {/* Invite Button */}
        <Button
          title="Invite Team Member"
          onPress={() => setShowInviteModal(true)}
          fullWidth
          icon={<UserPlus size={20} color={colors.white} />}
          style={styles.inviteButton}
        />
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <SafeArea>
          <View style={modalStyles.header}>
            <TouchableOpacity onPress={() => setShowInviteModal(false)}>
              <X size={24} color={colors.gray[600]} />
            </TouchableOpacity>
            <Text style={modalStyles.title}>Invite Team Member</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={modalStyles.content}>
            <Input
              label="Email Address"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail size={20} color={colors.gray[400]} />}
            />

            <Text style={modalStyles.roleLabel}>Role</Text>
            <View style={modalStyles.roleOptions}>
              {['member', 'manager', 'admin'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    modalStyles.roleOption,
                    inviteRole === role && modalStyles.roleOptionActive,
                  ]}
                  onPress={() => setInviteRole(role)}
                >
                  <Text style={[
                    modalStyles.roleText,
                    inviteRole === role && modalStyles.roleTextActive,
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Send Invitation"
              onPress={handleInvite}
              loading={inviteLoading}
              fullWidth
              size="lg"
              disabled={!inviteEmail.trim()}
            />
          </View>
        </SafeArea>
      </Modal>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.gray[900],
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.gray[900],
  },
  memberEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  pendingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warning[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteDate: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  inviteButton: {
    marginTop: spacing.lg,
  },
});

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.gray[900],
  },
  content: {
    padding: spacing.lg,
  },
  roleLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  roleOptions: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  roleOptionActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.gray[600],
  },
  roleTextActive: {
    color: colors.primary[700],
  },
});
