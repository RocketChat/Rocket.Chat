import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';

export const isMessageUnread = (subscription: ISubscription | undefined, message: IMessage, previous?: IMessage): boolean => {
	if (!subscription) {
		return false;
	}
	if (previous && isMessageUnread(subscription, previous)) {
		return false;
	}
	return message.ts > subscription.ls;
};
