export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
} as const;

export { default as UserStatus } from './UserStatus.js';
export { default as Busy } from './Busy.js';
export { default as Away } from './Away.js';
export { default as Online } from './Online.js';
export { default as Offline } from './Offline.js';
export { default as Loading } from './Loading.js';
