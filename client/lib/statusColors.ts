import { USER_STATUS } from '../../definition/UserStatus';

export default {
	[USER_STATUS.BUSY]: 'danger-500',
	[USER_STATUS.AWAY]: 'warning-600',
	[USER_STATUS.ONLINE]: 'success-500',
	[USER_STATUS.OFFLINE]: 'neutral-600',
} as const;
