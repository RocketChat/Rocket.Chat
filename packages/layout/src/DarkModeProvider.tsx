import { useDarkMode as useDarkModeFuselage } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

const DarkModeContext = createContext(true);

export type DarkModeProviderProps = {
	children?: ReactNode;
	forcedDarkMode?: boolean;
};

const DarkModeProvider = ({ children, forcedDarkMode }: DarkModeProviderProps) => {
	const value = useDarkModeFuselage(forcedDarkMode);
	return <DarkModeContext.Provider value={value}>{children}</DarkModeContext.Provider>;
};

export default DarkModeProvider;

export const useDarkMode = (): boolean => useContext(DarkModeContext);
