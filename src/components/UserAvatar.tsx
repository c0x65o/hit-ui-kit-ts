'use client';

import React, { useState, useEffect } from 'react';
import { Avatar } from './Avatar';

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

// Simple in-memory cache for profile pictures
// Key: email, Value: profile_picture_url (or null if none)
const profilePictureCache = new Map<string, string | null>();

// Track in-flight requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string | null>>();

/**
 * Get stored auth token from cookie or localStorage
 */
function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  // Try cookie first
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((cookie) => cookie.startsWith('hit_token='));
  if (match) {
    return decodeURIComponent(match.split('=').slice(1).join('='));
  }
  
  // Fallback to localStorage
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('hit_token');
  }
  
  return null;
}

/**
 * Fetch profile picture URL for a user
 * Uses the public /users/{email}/avatar endpoint that any authenticated user can access
 */
async function fetchProfilePicture(email: string): Promise<string | null> {
  // Check cache first
  if (profilePictureCache.has(email)) {
    return profilePictureCache.get(email) ?? null;
  }

  // Check if there's already a pending request for this email
  const pending = pendingRequests.get(email);
  if (pending) {
    return pending;
  }

  // Create the fetch promise
  const fetchPromise = (async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        profilePictureCache.set(email, null);
        return null;
      }

      // Use the public avatar endpoint - any authenticated user can access
      const response = await fetch(`/api/proxy/auth/users/${encodeURIComponent(email)}/avatar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const pictureUrl = data.profile_picture_url || null;
        profilePictureCache.set(email, pictureUrl);
        return pictureUrl;
      } else {
        profilePictureCache.set(email, null);
        return null;
      }
    } catch (err) {
      profilePictureCache.set(email, null);
      return null;
    } finally {
      pendingRequests.delete(email);
    }
  })();

  pendingRequests.set(email, fetchPromise);
  return fetchPromise;
}

/**
 * Generate a display name from email for initials
 */
function emailToDisplayName(email: string): string {
  // Extract the part before @ and convert to title case
  const localPart = email.split('@')[0];
  // Replace common separators with spaces
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
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
export function UserAvatar({ email, src, name, size = 'md', className }: UserAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(src || null);
  const [loading, setLoading] = useState(!src);

  useEffect(() => {
    // If src is provided, use it directly
    if (src) {
      setImageUrl(src);
      setLoading(false);
      return;
    }

    // Check cache first (synchronous)
    if (profilePictureCache.has(email)) {
      setImageUrl(profilePictureCache.get(email) ?? null);
      setLoading(false);
      return;
    }

    // Fetch the profile picture
    let cancelled = false;
    setLoading(true);

    fetchProfilePicture(email).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [email, src]);

  // Generate display name from email if not provided
  const displayName = name || emailToDisplayName(email);

  return (
    <Avatar
      src={imageUrl || undefined}
      name={displayName}
      size={size}
      className={className}
    />
  );
}

/**
 * Clear the profile picture cache (useful after profile updates)
 */
export function clearUserAvatarCache(email?: string) {
  if (email) {
    profilePictureCache.delete(email);
    pendingRequests.delete(email);
  } else {
    profilePictureCache.clear();
    pendingRequests.clear();
  }
}

/**
 * Pre-populate the cache (useful when you already have user data)
 */
export function setUserAvatarCache(email: string, profilePictureUrl: string | null) {
  profilePictureCache.set(email, profilePictureUrl);
}
