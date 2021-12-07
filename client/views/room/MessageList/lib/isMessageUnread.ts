import { IMessage } from '../../../../../definition/IMessage';
import { ISubscription } from '../../../../../definition/ISubscription';

export const isMessageUnread = (
	subscription: ISubscription | undefined,
	message: IMessage,
): boolean => {
	if (!subscription) {
		return false;
	}
	return message.ts > subscription.ls;
};
