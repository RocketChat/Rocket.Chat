import { createContext, useContext } from 'react';

type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
});

export const useCustomSound = (): CustomSoundContextValue => useContext(CustomSoundContext);
