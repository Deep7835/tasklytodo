/** Pictures shipped in /public/avatars (the id is the file name without `.svg`), each with a light backdrop color. */
export const AVATARS: { id: string; label: string; bg: string }[] = [
  { id: 'angela', label: 'Angela', bg: '#ffd9c7' },
  { id: 'ed', label: 'Ed', bg: '#cfe2ff' },
  { id: 'ishanvi', label: 'Ishanvi', bg: '#e4d7ff' },
  { id: 'justin', label: 'Justin', bg: '#c8efd9' },
  { id: 'kim', label: 'Kim', bg: '#fff0b8' },
  { id: 'krishna', label: 'Krishna', bg: '#c4ebe6' },
  { id: 'mary', label: 'Mary', bg: '#ffd4e3' },
  { id: 'matthew', label: 'Matthew', bg: '#d8dcff' },
  { id: 'matthew-heart', label: 'Matthew (heart)', bg: '#ffd0d6' },
  { id: 'salman', label: 'Salman', bg: '#f2e2c9' },
];

/** The shipped avatar for a saved id, or `undefined` when unset or no longer shipped. */
export const findAvatar = (id: string | null) => (id ? AVATARS.find((a) => a.id === id) : undefined);

export const avatarUrl = (id: string) => `/avatars/${id}.svg`;
