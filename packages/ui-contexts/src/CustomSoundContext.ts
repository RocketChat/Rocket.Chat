import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
	getList: () => {
		_id: string;
		name: string;
		extension: string;
		src: string;
		random?: string;
	}[];
};

export const CustomSoundContext = createContext<CustomSoundContextValue | undefined>(undefined);
