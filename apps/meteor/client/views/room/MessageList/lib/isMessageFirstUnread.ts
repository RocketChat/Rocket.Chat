import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';

export const isMessageFirstUnread = (subscription: ISubscription | undefined, message: IMessage, previous?: IMessage): boolean => {
	if (!subscription || subscription.unread === 0) {
		return false;
	}

	if (previous && isMessageFirstUnread(subscription, previous)) {
		return false;
	}

	return message.ts > subscription.ls;
};
