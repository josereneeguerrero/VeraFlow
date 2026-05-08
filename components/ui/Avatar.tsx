import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, borderRadius, fontSize, fontWeight } from '@/lib/constants';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

export function Avatar({ name, image, size = 'md', color }: AvatarProps) {
  const backgroundColor = color || colors.primary[500];
  const initials = name ? getInitials(name) : '?';

  if (image) {
    return (
      <Image
        source={{ uri: image }}
        style={[styles.image, styles[`size_${size}`]]}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        styles[`size_${size}`],
        { backgroundColor },
      ]}
    >
      <Text style={[styles.initials, styles[`initials_${size}`]]}>
        {initials}
      </Text>
    </View>
  );
}

interface AvatarGroupProps {
  users: Array<{ name?: string; image?: string }>;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarGroup({ users, max = 4, size = 'md' }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <View style={groupStyles.container}>
      {visibleUsers.map((user, index) => (
        <View
          key={index}
          style={[
            groupStyles.avatarWrapper,
            { marginLeft: index > 0 ? -8 : 0, zIndex: users.length - index },
          ]}
        >
          <Avatar name={user.name} image={user.image} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            groupStyles.avatarWrapper,
            groupStyles.remaining,
            styles[`size_${size}`],
            { marginLeft: -8 },
          ]}
        >
          <Text style={[styles.initials, styles[`initials_${size}`]]}>
            +{remaining}
          </Text>
        </View>
      )}
    </View>
  );
}

const sizes = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: borderRadius.full,
  },
  size_sm: {
    width: sizes.sm,
    height: sizes.sm,
    borderRadius: sizes.sm / 2,
  },
  size_md: {
    width: sizes.md,
    height: sizes.md,
    borderRadius: sizes.md / 2,
  },
  size_lg: {
    width: sizes.lg,
    height: sizes.lg,
    borderRadius: sizes.lg / 2,
  },
  size_xl: {
    width: sizes.xl,
    height: sizes.xl,
    borderRadius: sizes.xl / 2,
  },
  initials: {
    color: colors.white,
    fontWeight: fontWeight.semibold,
  },
  initials_sm: {
    fontSize: fontSize.xs,
  },
  initials_md: {
    fontSize: fontSize.sm,
  },
  initials_lg: {
    fontSize: fontSize.lg,
  },
  initials_xl: {
    fontSize: fontSize['2xl'],
  },
});

const groupStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: borderRadius.full,
  },
  remaining: {
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
