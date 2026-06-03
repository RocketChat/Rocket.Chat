import type { ICustomSound } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { CustomSoundContext, useStream, useUserPreference } from '@rocket.chat/ui-contexts';
import { playCallEndedChime, startRingerChime, startDialerChime } from '@rocket.chat/ui-voip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { defaultSounds, getCustomSoundURL, formatVolume } from './lib';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { useUserSoundPreferences } from '../../hooks/useUserSoundPreferences';

type CustomSoundProviderProps = {
	children?: ReactNode;
};

const CustomSoundProvider = ({ children }: CustomSoundProviderProps) => {
	const audioRefs = useRef<HTMLAudioElement[]>([]);
	// Holds the stop functions returned by the looped synthesized chimes
	// (ringer + dialer). Stored in a ref so they survive re-renders and
	// the stop API can reach them. Calling start twice without stopping
	// first replaces the prior loop — calling the prior stop first.
	const ringerStopRef = useRef<(() => void) | null>(null);
	const dialerStopRef = useRef<(() => void) | null>(null);

	const queryClient = useQueryClient();
	const streamAll = useStream('notify-all');

	const newRoomNotification = useUserPreference<string>('newRoomNotification') || 'door';
	const newMessageNotification = useUserPreference<string>('newMessageNotification') || 'chime';
	const { notificationsSoundVolume, voipRingerVolume } = useUserSoundPreferences();

	const { data: list } = useQuery({
		queryFn: async (): Promise<Omit<ICustomSound, '_updatedAt'>[]> => {
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
			playNewRoomLoop: () => play(newRoomNotification, { loop: true, volume: formatVolume(notificationsSoundVolume) }),
			playNewMessage: () => play(newMessageNotification, { loop: false, volume: formatVolume(notificationsSoundVolume) }),
			playNewMessageCustom: (soundId: ICustomSound['_id']) =>
				play(soundId, { loop: false, volume: formatVolume(notificationsSoundVolume) }),
			stopNewRoom: () => stop(newRoomNotification),
			stopNewMessage: () => stop(newMessageNotification),
		};
		// VoIP sounds are now fully synthesized via Web Audio — no MP3 assets,
		// no licensing concerns, no harsh legacy tones. The looped chimes
		// (ringer/dialer) return a stop handle which we store in a ref so
		// the matching stop* call can silence the loop. Calling play* twice
		// without stopping first silently replaces the prior loop.
		//
		// IMPORTANT: playRinger / playDialer must ALSO return their stop fn
		// directly — useCallSounds (and a few other callers) use it as the
		// React effect cleanup. Returning undefined here silently leaks the
		// ringtone past the state transition (e.g. "calling" → "active")
		// and the loop runs forever.
		const stopRinger = () => {
			ringerStopRef.current?.();
			ringerStopRef.current = null;
		};
		const startRinger = () => {
			ringerStopRef.current?.();
			ringerStopRef.current = startRingerChime();
			return stopRinger;
		};
		const stopDialer = () => {
			dialerStopRef.current?.();
			dialerStopRef.current = null;
		};
		const startDialer = () => {
			dialerStopRef.current?.();
			dialerStopRef.current = startDialerChime();
			return stopDialer;
		};
		const voipSounds = {
			playRinger: startRinger,
			playDialer: startDialer,
			playCallEnded: () => playCallEndedChime(),
			stopRinger,
			stopDialer,
			stopCallEnded: () => undefined,
			stopAll: () => {
				stopRinger();
				stopDialer();
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

	return <CustomSoundContext.Provider value={contextValue}>{children}</CustomSoundContext.Provider>;
};

export default CustomSoundProvider;
