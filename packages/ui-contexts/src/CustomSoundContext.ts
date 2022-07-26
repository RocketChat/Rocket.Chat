import { createContext } from 'react';

export type CustomSoundContextValue = {
	play: (sound: string, options?: { volume?: number; loop?: boolean }) => void;
	pause: (sound: string) => void;
	getList: () => {
		_id: string;
		name: string;
		extension: string;
		src: string;
		random?: string;
	}[] | undefined;
};

export const CustomSoundContext = createContext<CustomSoundContextValue>({
	play: () => undefined,
	pause: () => undefined,
	getList: () => undefined,
});
