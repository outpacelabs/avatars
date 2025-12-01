'use client';

import { hashString } from '@/lib/utils/colors';

export const TOTAL_GRADIENTS = 50;

interface GradientAvatarProps {
  /** Session ID or user ID (used for hashing if gradientIndex not provided) */
  sessionId: string;
  /** Explicit gradient index (0-49). If provided, overrides sessionId hash. */
  gradientIndex?: number;
  /** Size in pixels (default: 32) */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays a mesh gradient avatar.
 * Uses explicit gradientIndex if provided, otherwise hashes sessionId.
 */
export function GradientAvatar({
  sessionId,
  gradientIndex,
  size = 32,
  className = '',
}: GradientAvatarProps) {
  // Use explicit index if provided, otherwise hash the session ID
  const index = gradientIndex ?? (hashString(sessionId) % TOTAL_GRADIENTS);

  return (
    <img
      src={`/avatars/gradient-${index}.jpg`}
      alt="User avatar"
      className={`rounded-full ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}
