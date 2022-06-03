import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
	pause: (sound: string) => void;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
	pause: () => undefined,
});
