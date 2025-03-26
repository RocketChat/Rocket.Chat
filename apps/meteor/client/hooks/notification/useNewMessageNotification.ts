import type { AtLeast, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import { CustomSounds } from '../../../app/custom-sounds/client/lib/CustomSounds';
import { useUserSoundPreferences } from '../useUserSoundPreferences';

export const useNewMessageNotification = () => {
	const newMessageNotification = useUserPreference<string>('newMessageNotification');
	const { notificationsSoundVolume } = useUserSoundPreferences();

	const notifyNewMessage = useEffectEvent((sub: AtLeast<ISubscription, 'rid'>) => {
		if (!sub || sub.audioNotificationValue === 'none') {
			return;
		}
		if (sub.audioNotificationValue && sub.audioNotificationValue !== '0') {
			void CustomSounds.play(sub.audioNotificationValue, {
				volume: Number((notificationsSoundVolume / 100).toPrecision(2)),
			});
		}

		if (newMessageNotification && newMessageNotification !== 'none') {
			void CustomSounds.play(newMessageNotification, {
				volume: Number((notificationsSoundVolume / 100).toPrecision(2)),
			});
		}
	});
	return notifyNewMessage;
};
