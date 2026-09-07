import React from 'react';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  displayName: string;
  avatarUrl: string | null;
  /** Tailwind size classes for the avatar container, e.g. "w-8 h-8" */
  size?: string;
}

/**
 * Displays a user avatar from `profiles.avatar_url` with a fallback
 * icon when no image is available.
 */
export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  displayName,
  avatarUrl,
  size = 'w-7 h-7'
}) => {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName}
        className={`${size} rounded-full object-cover ring-1 ring-slate-700`}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    );
  }

  // Fallback: first letter of name or generic icon
  const initial = displayName.charAt(0).toUpperCase();
  if (initial && initial !== 'J') {
    // "Jogador Anônimo" gets the icon fallback
    return (
      <span
        className={`${size} rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center text-xs font-bold text-slate-400`}
        title={displayName}
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={`${size} rounded-full bg-slate-800 ring-1 ring-slate-700 flex items-center justify-center`}
      title={displayName}
    >
      <User className="w-3.5 h-3.5 text-slate-500" />
    </span>
  );
};
