import type { ISubscription } from '@rocket.chat/core-typings';

export const isInviteSubscription = (subscription: ISubscription | undefined): boolean => {
	return subscription?.status === 'INVITED';
};
