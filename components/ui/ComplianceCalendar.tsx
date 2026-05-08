import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { Card } from './Card';
import { Badge } from './Badge';
import { fontSize, fontWeight, spacing, borderRadius } from '@/lib/constants';
import { useThemeColors, ThemeColors } from '@/lib/theme';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Calendar, AlertCircle, FileText, CheckSquare, GraduationCap } from 'lucide-react-native';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'deadline' | 'policy_review' | 'training' | 'audit';
  entityId: string;
  entityType: 'workflow' | 'policy' | 'training';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceCalendarProps {
  workspaceId: Id<"workspaces">;
  compact?: boolean;
}

export function ComplianceCalendar({ workspaceId, compact = false }: ComplianceCalendarProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = createStyles(colors, compact);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const workflows = useQuery(api.workflows.list, { workspaceId });
  const policies = useQuery(api.policies.list, { workspaceId });

  const events = useMemo(() => {
    const eventList: CalendarEvent[] = [];

    workflows?.forEach((workflow) => {
      if (workflow.dueDate && workflow.status === 'active') {
        eventList.push({
          id: `workflow-${workflow._id}`,
          title: workflow.name,
          date: new Date(workflow.dueDate),
          type: 'deadline',
          entityId: workflow._id,
          entityType: 'workflow',
          priority: 'high',
        });
      }
    });

    policies?.forEach((policy) => {
      if (policy.nextReviewDate) {
        eventList.push({
          id: `policy-${policy._id}`,
          title: `Review: ${policy.name}`,
          date: new Date(policy.nextReviewDate),
          type: 'policy_review',
          entityId: policy._id,
          entityType: 'policy',
          priority: 'medium',
        });
      }
    });

    return eventList.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [workflows, policies]);

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(
      (e) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (date: Date | null) =>
    date &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return <CheckSquare size={12} color={colors.error[500]} />;
      case 'policy_review':
        return <FileText size={12} color={colors.warning[500]} />;
      case 'training':
        return <GraduationCap size={12} color={colors.primary[500]} />;
      case 'audit':
        return <AlertCircle size={12} color={colors.error[500]} />;
      default:
        return <Calendar size={12} color={colors.primary[500]} />;
    }
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'deadline':
        return colors.error[500];
      case 'policy_review':
        return colors.warning[500];
      case 'training':
        return colors.primary[500];
      case 'audit':
        return colors.error[500];
      default:
        return colors.primary[500];
    }
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (event.entityType === 'workflow') {
      router.push(`/(tabs)/workflows/${event.entityId}`);
    } else if (event.entityType === 'policy') {
      router.push(`/(tabs)/policies/${event.entityId}`);
    }
  };

  const upcomingEvents = events.filter(
    (e) => e.date >= today && e.date <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <View style={styles.compactHeader}>
          <View style={styles.compactTitleRow}>
            <Calendar size={20} color={colors.primary[500]} />
            <Text style={styles.compactTitle}>Upcoming Deadlines</Text>
          </View>
          {upcomingEvents.length > 0 && (
            <Badge label={`${upcomingEvents.length}`} variant="primary" size="sm" />
          )}
        </View>

        {upcomingEvents.length === 0 ? (
          <Text style={styles.noEvents}>No upcoming deadlines in the next 7 days</Text>
        ) : (
          <View style={styles.upcomingList}>
            {upcomingEvents.slice(0, 4).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.upcomingItem}
                onPress={() => handleEventPress(event)}
              >
                <View style={[styles.eventDot, { backgroundColor: getEventColor(event.type) }]} />
                <View style={styles.upcomingContent}>
                  <Text style={styles.upcomingTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.upcomingDate}>
                    {event.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                {getEventIcon(event.type)}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Compliance Calendar</Text>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
            <ChevronLeft size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.monthYear}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
            <ChevronRight size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.weekDays}>
        {dayNames.map((day) => (
          <Text key={day} style={styles.weekDay}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {daysInMonth.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const hasEvents = dayEvents.length > 0;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isToday(date) && styles.todayCell,
                !date && styles.emptyCell,
              ]}
              disabled={!date}
              onPress={() => {
                if (hasEvents) {
                  handleEventPress(dayEvents[0]);
                }
              }}
            >
              {date && (
                <>
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday(date) && styles.todayNumber,
                      hasEvents && styles.eventDayNumber,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicators}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <View
                          key={i}
                          style={[
                            styles.eventIndicator,
                            { backgroundColor: getEventColor(event.type) },
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {upcomingEvents.length > 0 && (
        <View style={styles.upcomingSection}>
          <Text style={styles.upcomingSectionTitle}>Upcoming This Week</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upcomingEvents.slice(0, 5).map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.upcomingCard}
                onPress={() => handleEventPress(event)}
              >
                <View style={[styles.upcomingCardBorder, { backgroundColor: getEventColor(event.type) }]} />
                <View style={styles.upcomingCardContent}>
                  <Text style={styles.upcomingCardTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.upcomingCardDate}>
                    {event.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </Card>
  );
}

const createStyles = (colors: ThemeColors, compact: boolean) =>
  StyleSheet.create({
    card: {
      marginBottom: spacing.lg,
    },
    compactCard: {
      marginBottom: spacing.lg,
    },
    compactHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    compactTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compactTitle: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      color: colors.text.primary,
    },
    noEvents: {
      fontSize: fontSize.sm,
      color: colors.text.secondary,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
    upcomingList: {
      gap: spacing.sm,
    },
    upcomingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    eventDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: spacing.md,
    },
    upcomingContent: {
      flex: 1,
    },
    upcomingTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text.primary,
    },
    upcomingDate: {
      fontSize: fontSize.xs,
      color: colors.text.secondary,
      marginTop: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.text.primary,
    },
    navigation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    navButton: {
      padding: spacing.xs,
    },
    monthYear: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.text.primary,
      minWidth: 140,
      textAlign: 'center',
    },
    weekDays: {
      flexDirection: 'row',
      marginBottom: spacing.sm,
    },
    weekDay: {
      flex: 1,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: colors.text.tertiary,
      textAlign: 'center',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xs,
    },
    emptyCell: {
      backgroundColor: 'transparent',
    },
    todayCell: {
      backgroundColor: colors.primary[500] + '20',
      borderRadius: borderRadius.md,
    },
    dayNumber: {
      fontSize: fontSize.sm,
      color: colors.text.secondary,
    },
    todayNumber: {
      color: colors.primary[600],
      fontWeight: fontWeight.bold,
    },
    eventDayNumber: {
      fontWeight: fontWeight.semibold,
      color: colors.text.primary,
    },
    eventIndicators: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 2,
    },
    eventIndicator: {
      width: 4,
      height: 4,
      borderRadius: 2,
    },
    upcomingSection: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    upcomingSectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: colors.text.secondary,
      marginBottom: spacing.md,
    },
    upcomingCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginRight: spacing.md,
      overflow: 'hidden',
      minWidth: 160,
    },
    upcomingCardBorder: {
      width: 4,
    },
    upcomingCardContent: {
      padding: spacing.md,
    },
    upcomingCardTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    upcomingCardDate: {
      fontSize: fontSize.xs,
      color: colors.text.secondary,
    },
  });
