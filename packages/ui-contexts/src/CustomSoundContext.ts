import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
});
