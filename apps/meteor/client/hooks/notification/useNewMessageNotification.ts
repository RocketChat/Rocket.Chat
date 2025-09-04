import type { AtLeast, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCustomSound } from '@rocket.chat/ui-contexts';

import { Subscriptions } from '../../stores';

export const useNewMessageNotification = () => {
	const { notificationSounds } = useCustomSound();

	const notifyNewMessage = useEffectEvent((sub: AtLeast<ISubscription, 'rid'>) => {
		if (!sub || sub.audioNotificationValue === 'none') {
			return;
		}

		const subscription = Subscriptions.state.find((record) => record.rid === sub.rid);

		if (subscription?.audioNotificationValue) {
			return notificationSounds.playNewMessageCustom(subscription.audioNotificationValue);
		}

		notificationSounds.playNewMessage();
	});
	return notifyNewMessage;
};
