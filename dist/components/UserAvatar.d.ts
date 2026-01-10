export interface UserAvatarProps {
    /** User email - used to fetch profile picture and generate initials */
    email: string;
    /** Optional pre-loaded image URL (skips fetch if provided) */
    src?: string;
    /** Optional display name for better initials */
    name?: string;
    /** Avatar size */
    size?: 'sm' | 'md' | 'lg';
    /** Custom class name */
    className?: string;
}
/**
 * UserAvatar - Smart avatar component that auto-fetches profile pictures
 *
 * Usage:
 * ```tsx
 * // Basic - will fetch profile picture automatically
 * <UserAvatar email="user@example.com" />
 *
 * // With pre-loaded src (skips fetch)
 * <UserAvatar email="user@example.com" src={user.profile_picture_url} />
 *
 * // With display name for better initials
 * <UserAvatar email="user@example.com" name="John Doe" />
 *
 * // Different sizes
 * <UserAvatar email="user@example.com" size="lg" />
 * ```
 */
export declare function UserAvatar({ email, src, name, size, className }: UserAvatarProps): import("react/jsx-runtime").JSX.Element;
/**
 * Clear the profile picture cache (useful after profile updates)
 */
export declare function clearUserAvatarCache(email?: string): void;
/**
 * Pre-populate the cache (useful when you already have user data)
 */
export declare function setUserAvatarCache(email: string, profilePictureUrl: string | null): void;
//# sourceMappingURL=UserAvatar.d.ts.map