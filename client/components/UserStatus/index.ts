export const colors = {
	busy: 'danger-500',
	away: 'warning-600',
	online: 'success-500',
	offline: 'neutral-600',
} as const;

export { default as UserStatus } from './UserStatus';
export { default as Busy } from './Busy';
export { default as Away } from './Away';
export { default as Online } from './Online';
export { default as Offline } from './Offline';
export { default as Loading } from './Loading';
export { default as ReactiveUserStatus } from './ReactiveUserStatus';
