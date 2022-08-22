import type { ICustomSound } from '@rocket.chat/core-typings';
import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
	pause: (sound: string) => void;
	getList: () => ICustomSound[] | undefined;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
	pause: () => undefined,
	getList: () => undefined,
});
