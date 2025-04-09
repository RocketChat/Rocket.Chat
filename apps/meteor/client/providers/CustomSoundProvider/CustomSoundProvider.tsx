import type { ICustomSound } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { CustomSoundContext, useStream, useUserPreference } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { defaultSounds, formatVolume, getCustomSoundURL } from './lib/helpers';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useUserSoundPreferences } from '../../hooks/useUserSoundPreferences';

type CustomSoundProviderProps = {
	children?: ReactNode;
};

const CustomSoundProvider = ({ children }: CustomSoundProviderProps) => {
	const audioRefs = useRef<HTMLAudioElement[]>([]);

	const queryClient = useQueryClient();
	const streamAll = useStream('notify-all');

	const newRoomNotification = useUserPreference<string>('newRoomNotification') || 'door';
	const newMessageNotification = useUserPreference<string>('newMessageNotification') || 'chime';
	const { notificationsSoundVolume, voipRingerVolume } = useUserSoundPreferences();

	const { data: list } = useQuery({
		queryFn: async () => {
			const customSoundsList = await sdk.call('listCustomSounds');
			if (!customSoundsList.length) {
				return defaultSounds;
			}
			return [...customSoundsList.map((sound) => ({ ...sound, src: getCustomSoundURL(sound) })), ...defaultSounds];
		},
		queryKey: ['listCustomSounds'],
		initialData: defaultSounds,
	});

	const play = useEffectEvent((soundId: ICustomSound['_id'], { volume = 1, loop = false } = {}) => {
		stop(soundId);

		const item = list?.find(({ _id }) => _id === soundId);
		if (!item?.src) {
			console.error('Unable to play sound', soundId);
			return;
		}

		const audio = new Audio(item.src);
		audio.volume = volume;
		audio.loop = loop;
		audio.id = soundId;
		audio.play();

		audioRefs.current = [...audioRefs.current, audio];

		return () => {
			stop(soundId);
		};
	});

	const pause = useEffectEvent((soundId: ICustomSound['_id']) => {
		const current = audioRefs.current?.find(({ id }) => id === soundId);
		if (current) {
			current.pause();
			audioRefs.current = audioRefs.current.filter(({ id }) => id !== soundId);
		}
	});

	const stop = useEffectEvent((soundId: ICustomSound['_id']) => {
		const current = audioRefs.current?.find(({ id }) => id === soundId);
		if (current) {
			current.load();
			audioRefs.current = audioRefs.current.filter(({ id }) => id !== soundId);
		}
	});

	const contextValue = useMemo(() => {
		const notificationSounds = {
			playNewRoom: () => play(newRoomNotification, { loop: false, volume: formatVolume(notificationsSoundVolume) }),
			playNewMessage: () => play(newMessageNotification, { loop: false, volume: formatVolume(notificationsSoundVolume) }),
			playNewMessageLoop: () => play(newMessageNotification, { loop: true, volume: formatVolume(notificationsSoundVolume) }),
			stopNewRoom: () => stop(newRoomNotification),
			stopNewMessage: () => stop(newMessageNotification),
		};
		const voipSounds = {
			playRinger: () => play('telephone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playDialer: () => play('outbound-call-ringing', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playCallEnded: () => play('call-ended', { loop: false, volume: formatVolume(voipRingerVolume) }),
			stopRinger: () => stop('telephone'),
			stopDialer: () => stop('outbound-call-ringing'),
			stopCallEnded: () => stop('call-ended'),
			stopAll: () => {
				stop('telephone');
				stop('outbound-call-ringing');
				stop('call-ended');
			},
		};
		const callSounds = {
			playRinger: () => play('ringtone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			playDialer: () => play('dialtone', { loop: true, volume: formatVolume(voipRingerVolume) }),
			stopRinger: () => stop('ringtone'),
			stopDialer: () => stop('dialtone'),
		};
		return {
			list,
			notificationSounds,
			callSounds,
			voipSounds,
			play,
			pause,
			stop,
		};
	}, [list, newMessageNotification, newRoomNotification, notificationsSoundVolume, pause, play, stop, voipRingerVolume]);

	useEffect(() => {
		return streamAll('public-info', ([key]) => {
			switch (key) {
				case 'updateCustomSound':
					queryClient.invalidateQueries({ queryKey: ['listCustomSounds'] });
					break;
				case 'deleteCustomSound':
					queryClient.invalidateQueries({ queryKey: ['listCustomSounds'] });

					break;
			}
		});
	}, [queryClient, streamAll]);

	return <CustomSoundContext.Provider children={children} value={contextValue} />;
};

export default CustomSoundProvider;
