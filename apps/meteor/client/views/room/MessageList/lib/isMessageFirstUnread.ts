import type { ISubscription, IMessage } from '@rocket.chat/core-typings';

export const isMessageFirstUnread = (subscription: ISubscription | undefined, message: IMessage, previous?: IMessage): boolean => {
	if (!subscription || subscription.unread === 0) {
		return false;
	}

	if (previous && isMessageFirstUnread(subscription, previous)) {
		return false;
	}

	return message.ts > subscription.ls;
};
