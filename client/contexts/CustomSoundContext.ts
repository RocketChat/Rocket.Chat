import { createContext, useContext } from 'react';

type CustomSoundContextValue = {
	play: () => void;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
});

export const useCustomSound = (): CustomSoundContextValue =>
	useContext(CustomSoundContext);
