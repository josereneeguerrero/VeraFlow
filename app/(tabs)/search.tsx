import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { SafeArea, Header } from '@/components/layout';
import { SearchBar, Card, StatusBadge, PriorityBadge, Avatar, EmptyState } from '@/components/ui';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { 
  ListChecks, Lightbulb, User, ChevronRight, Search as SearchIcon 
} from 'lucide-react-native';
import { debounce } from '@/lib/utils';

export default function SearchScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const workspace = useQuery(api.workspaces.getCurrent);
  const searchResults = useQuery(
    api.search.globalSearch,
    workspace && debouncedQuery.length >= 2
      ? { workspaceId: workspace._id, query: debouncedQuery }
      : 'skip'
  );

  const debouncedSetQuery = useCallback(
    debounce((query: string) => {
      setDebouncedQuery(query);
    }, 300),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSetQuery(text);
  };

  const hasResults = searchResults && (
    searchResults.workflows.length > 0 ||
    searchResults.recommendations.length > 0 ||
    searchResults.members.length > 0
  );

  const showEmptyState = debouncedQuery.length >= 2 && !hasResults && searchResults !== undefined;

  return (
    <SafeArea>
      <Header showBack title="Search" />
      
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search workflows, actions, members..."
          autoFocus
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {debouncedQuery.length < 2 && (
          <View style={styles.hintContainer}>
            <SearchIcon size={48} color={colors.text.tertiary} />
            <Text style={styles.hintTitle}>Search VeraFlow</Text>
            <Text style={styles.hintText}>
              Find workflows, recommendations, and team members.{'\n'}
              Type at least 2 characters to search.
            </Text>
          </View>
        )}

        {showEmptyState && (
          <EmptyState
            icon={<SearchIcon size={48} color={colors.text.tertiary} />}
            title="No results found"
            description={`No results for "${debouncedQuery}". Try a different search term.`}
          />
        )}

        {hasResults && (
          <>
            {searchResults.workflows.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workflows</Text>
                {searchResults.workflows.map((workflow) => (
                  <Card
                    key={workflow._id}
                    style={styles.resultCard}
                    onPress={() => router.push(`/(tabs)/workflows/${workflow._id}`)}
                  >
                    <View style={styles.resultRow}>
                      <View style={styles.resultIcon}>
                        <ListChecks size={20} color={colors.primary[500]} />
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{workflow.name}</Text>
                        <Text style={styles.resultDescription} numberOfLines={1}>
                          {workflow.description}
                        </Text>
                      </View>
                      <StatusBadge status={workflow.status} size="sm" />
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {searchResults.recommendations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recommendations</Text>
                {searchResults.recommendations.map((rec) => (
                  <Card
                    key={rec._id}
                    style={styles.resultCard}
                    onPress={() => router.push(`/(tabs)/recommendations/${rec._id}`)}
                  >
                    <View style={styles.resultRow}>
                      <View style={[styles.resultIcon, styles.resultIconWarning]}>
                        <Lightbulb size={20} color={colors.warning[500]} />
                      </View>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{rec.title}</Text>
                        <Text style={styles.resultDescription} numberOfLines={1}>
                          {rec.category}
                        </Text>
                      </View>
                      <PriorityBadge priority={rec.priority} size="sm" />
                      <ChevronRight size={16} color={colors.text.tertiary} />
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {searchResults.members.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team Members</Text>
                {searchResults.members.map((member) => (
                  <Card
                    key={member._id}
                    style={styles.resultCard}
                  >
                    <View style={styles.resultRow}>
                      <Avatar name={member.name} size="sm" />
                      <View style={styles.resultContent}>
                        <Text style={styles.resultTitle}>{member.name}</Text>
                        <Text style={styles.resultDescription}>{member.email}</Text>
                      </View>
                      <Text style={styles.roleText}>{member.role}</Text>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  hintContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  hintTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  hintText: {
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  resultIconWarning: {
    backgroundColor: colors.warning[50],
  },
  resultContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  resultTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  resultDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  roleText: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    textTransform: 'capitalize',
    marginRight: spacing.sm,
  },
});
