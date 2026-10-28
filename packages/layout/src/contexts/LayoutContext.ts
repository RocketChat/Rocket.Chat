import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

export type LayoutContextValue = {
	logo?: ReactNode;
	logoDark?: ReactNode;
	background?: string;
	backgroundDark?: string;
	forceDarkMode?: boolean;
};

export const LayoutContext = createContext<LayoutContextValue>({});

export const useLayoutContext = () => useContext(LayoutContext);
