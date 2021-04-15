import { createContext, useContext } from 'react';

export type BackButtonContextValue = {
	backButtonPath: string;
	setbackButtonPath: Function;
};

export const BackButtonContext = createContext<BackButtonContextValue>({
	backButtonPath: '',
	setbackButtonPath: () => undefined,
});

export const useBackButton = (): BackButtonContextValue => useContext(BackButtonContext);
