import { createContext, useContext } from 'react';

export const CustomSoundContext = createContext({
	play: () => {},
});

export const useCustomSound = () => useContext(CustomSoundContext);
