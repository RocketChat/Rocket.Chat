import type { ICustomSound } from '@rocket.chat/core-typings';
import { NotificationSoundsContext, useCustomSound, useUserPreference } from '@rocket.chat/ui-contexts';
import { useMemo, type ReactNode } from 'react';

import { useUserSoundPreferences } from '../hooks/useUserSoundPreferences';
import { formatVolume } from './CustomSoundProvider/lib/formatVolume';

export type NotificationSoundsProviderProps = {
	children?: ReactNode;
};

/** Plays the sounds the user picked for new rooms and new messages, at their notification volume. */
const NotificationSoundsProvider = ({ children }: NotificationSoundsProviderProps) => {
	const { play, stop } = useCustomSound();

	const newRoomNotification = useUserPreference<string>('newRoomNotification') || 'door';
	const newMessageNotification = useUserPreference<string>('newMessageNotification') || 'chime';
	const { notificationsSoundVolume } = useUserSoundPreferences();

	const contextValue = useMemo(() => {
		const volume = formatVolume(notificationsSoundVolume);

		return {
			playNewRoom: () => play(newRoomNotification, { loop: false, volume }),
			playNewRoomLoop: () => play(newRoomNotification, { loop: true, volume }),
			playNewMessage: () => play(newMessageNotification, { loop: false, volume }),
			playNewMessageCustom: (soundId: ICustomSound['_id']) => play(soundId, { loop: false, volume }),
			stopNewRoom: () => stop(newRoomNotification),
			stopNewMessage: () => stop(newMessageNotification),
		};
	}, [newMessageNotification, newRoomNotification, notificationsSoundVolume, play, stop]);

	return <NotificationSoundsContext.Provider value={contextValue}>{children}</NotificationSoundsContext.Provider>;
};

export default NotificationSoundsProvider;
