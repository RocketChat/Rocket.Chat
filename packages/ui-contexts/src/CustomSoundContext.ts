import type { ICustomSound } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: ICustomSound['_id'], options?: { volume?: number; loop?: boolean }) => void;
	pause: (sound: ICustomSound['_id']) => void;
	stop: (sound: ICustomSound['_id']) => void;
	getList: () => ICustomSound[] | undefined;
	isPlaying: (sound: ICustomSound['_id']) => boolean | null;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
	pause: () => undefined,
	stop: () => undefined,
	getList: () => undefined,
	isPlaying: () => false,
});
