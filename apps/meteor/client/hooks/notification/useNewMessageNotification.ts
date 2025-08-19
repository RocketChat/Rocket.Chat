import type { AtLeast, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCustomSound } from '@rocket.chat/ui-contexts';

export const useNewMessageNotification = () => {
	const { notificationSounds } = useCustomSound();

	const notifyNewMessage = useEffectEvent((sub: AtLeast<ISubscription, 'rid'>) => {
		if (!sub || sub.audioNotificationValue === 'none') {
			return;
		}
		// TODO: Fix this - Room Notifications Preferences > sound > desktop is not working.
		// plays the user notificationSound preference

		// if (sub.audioNotificationValue && sub.audioNotificationValue !== '0') {
		// 	void CustomSounds.play(sub.audioNotificationValue, {
		// 		volume: Number((notificationsSoundVolume / 100).toPrecision(2)),
		// 	});
		// }

		notificationSounds.playNewMessage();
	});
	return notifyNewMessage;
};
