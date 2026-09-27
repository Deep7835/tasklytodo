import type { CSSProperties } from 'react';
import { User } from 'reicon-react';
import { avatarUrl, findAvatar, type AVATARS } from '../lib/avatars';
import { cn } from '../lib/ui';
import { useStore } from '../store/store';

/** A shipped avatar picture on its pastel, grainy backdrop. */
export function AvatarImage({ avatar, className }: { avatar: (typeof AVATARS)[number]; className?: string }) {
  return (
    <span className={cn('avatar-bg block shrink-0 overflow-hidden rounded-full ring-1 ring-black/5', className)} style={{ '--av': avatar.bg } as CSSProperties}>
      <img src={avatarUrl(avatar.id)} alt="" draggable={false} className="size-full object-cover" />
    </span>
  );
}

/** The user's chosen avatar, falling back to their initial (or a person icon) on the accent button style. */
export function Avatar({ className = 'size-9', textClass = 'text-[14px]' }: { className?: string; textClass?: string }) {
  const { prefs } = useStore();
  const avatar = findAvatar(prefs.avatar);
  const name = prefs.name.trim();

  if (avatar) return <AvatarImage avatar={avatar} className={className} />;
  return (
    <span className={cn('btn-primary grid shrink-0 place-items-center rounded-full font-medium', textClass, className)} aria-hidden>
      {name ? name[0].toUpperCase() : <User className="size-[55%]" />}
    </span>
  );
}
