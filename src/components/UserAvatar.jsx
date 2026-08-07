import React, { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * Bulletproof Priority Helper Logic to Generate Upper-case Initials:
 * 1. Full name available -> First letter of First Name + First letter of Last Name (or single initial if 1 word)
 * 2. Full name missing   -> First two letters of Email username (before @)
 */
export function getUserInitials(user) {
  try {
    if (!user || typeof user !== 'object') return 'TS';

    const rawName = user.name || user.fullName || user.displayName;
    if (rawName && typeof rawName === 'string') {
      const trimmedName = rawName.trim();
      if (trimmedName) {
        const parts = trimmedName.split(/\s+/).filter(p => typeof p === 'string' && p.length > 0);
        if (parts.length >= 2) {
          const first = parts[0].charAt(0).toUpperCase();
          const last = parts[parts.length - 1].charAt(0).toUpperCase();
          if (first && last) return first + last;
        } else if (parts.length === 1) {
          const first = parts[0].charAt(0).toUpperCase();
          if (first) return first;
        }
      }
    }

    const rawEmail = user.email;
    if (rawEmail && typeof rawEmail === 'string' && rawEmail.includes('@')) {
      const username = rawEmail.split('@')[0].trim();
      if (username.length >= 2) {
        return username.slice(0, 2).toUpperCase();
      } else if (username.length === 1) {
        return username.toUpperCase();
      }
    }
  } catch (err) {
    console.error('[UserAvatar] Error generating initials:', err);
  }

  return 'TS';
}

const UserAvatar = React.memo(function UserAvatar({
  user,
  size = 30,
  className = '',
  showStatus = false,
  isOnline = true,
  onClick
}) {
  const [imageError, setImageError] = useState(false);
  const initials = getUserInitials(user);
  const rawAvatar = user?.avatar || user?.profilePic || user?.photoURL || null;
  const avatarUrl = !imageError && typeof rawAvatar === 'string' && rawAvatar.trim() ? rawAvatar.trim() : null;

  return (
    <motion.div
      className={`user-avatar-wrapper ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        background: avatarUrl ? 'transparent' : 'var(--accent-gradient)',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 4px 14px rgba(244, 197, 66, 0.25)',
        flexShrink: 0,
        userSelect: 'none',
        cursor: onClick ? 'pointer' : 'default'
      }}
      title={typeof user?.name === 'string' ? user.name : (typeof user?.email === 'string' ? user.email : 'User Profile')}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={typeof user?.name === 'string' ? user.name : 'User Avatar'}
          onError={() => setImageError(true)}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <span
          style={{
            color: '#0E0E10',
            fontWeight: 800,
            fontSize: `${Math.max(10, Math.round(size * 0.42))}px`,
            lineHeight: 1,
            letterSpacing: '-0.5px'
          }}
        >
          {initials}
        </span>
      )}

      {showStatus && (
        <span
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: `${Math.max(8, Math.round(size * 0.28))}px`,
            height: `${Math.max(8, Math.round(size * 0.28))}px`,
            borderRadius: '50%',
            background: isOnline ? '#22C55E' : '#9CA3AF',
            border: '2px solid var(--bg-card)',
            boxShadow: '0 0 6px rgba(0,0,0,0.5)'
          }}
        />
      )}
    </motion.div>
  );
});

export default UserAvatar;
