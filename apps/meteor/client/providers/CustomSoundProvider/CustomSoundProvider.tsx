import type { ICustomSound } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomSoundContext, useEndpoint, useStream } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';

import { defaultSounds, getCustomSoundURL } from './lib';

export type CustomSoundProviderProps = {
	children?: ReactNode;
};

const CustomSoundProvider = ({ children }: CustomSoundProviderProps) => {
	const audioRefs = useRef<HTMLAudioElement[]>([]);

	const queryClient = useQueryClient();
	const streamAll = useStream('notify-all');
	const getCustomSounds = useEndpoint('GET', '/v1/custom-sounds.list');

	const { data: list } = useQuery({
		queryFn: async (): Promise<Omit<ICustomSound, '_updatedAt'>[]> => {
			// `/v1/custom-sounds.list` is paginated, so we page through all results to
			// load every custom sound into the provider (the legacy `listCustomSounds`
			// method returned them all at once).
			const sounds: Awaited<ReturnType<typeof getCustomSounds>>['sounds'] = [];
			let total = Infinity;
			while (sounds.length < total) {
				const page = await getCustomSounds({ count: 100, offset: sounds.length });
				total = page.total;
				sounds.push(...page.sounds);
				if (!page.sounds.length) {
					break;
				}
			}

			if (!sounds.length) {
				return defaultSounds;
			}
			return [...sounds.map(({ _updatedAt: _, ...sound }) => ({ ...sound, src: getCustomSoundURL(sound) })), ...defaultSounds];
		},
		queryKey: ['listCustomSounds'],
		initialData: defaultSounds,
	});

	const play = useStableCallback((soundId: ICustomSound['_id'], { volume = 1, loop = false } = {}) => {
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

	const pause = useStableCallback((soundId: ICustomSound['_id']) => {
		const current = audioRefs.current?.find(({ id }) => id === soundId);
		if (current) {
			current.pause();
			audioRefs.current = audioRefs.current.filter(({ id }) => id !== soundId);
		}
	});

	const stop = useStableCallback((soundId: ICustomSound['_id']) => {
		const current = audioRefs.current?.find(({ id }) => id === soundId);
		if (current) {
			current.load();
			audioRefs.current = audioRefs.current.filter(({ id }) => id !== soundId);
		}
	});

	const contextValue = useMemo(() => ({ list, play, pause, stop }), [list, pause, play, stop]);

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
