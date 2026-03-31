import type { ThemePreference as ThemeMode } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { createContext, useState, useMemo } from 'react';

export type ThemePreviewContextType = {
	previewTheme: ThemeMode | undefined;
	setPreviewTheme: (theme: ThemeMode) => void;
	clearPreviewTheme: () => void;
};

export const ThemePreviewContext = createContext<ThemePreviewContextType | undefined>(undefined);

type ThemePreviewProviderProps = {
	children: ReactNode;
};

export const ThemePreviewProvider = ({ children }: ThemePreviewProviderProps) => {
	const [previewTheme, setPreviewThemeState] = useState<ThemeMode | undefined>(undefined);

	const value = useMemo<ThemePreviewContextType>(
		() => ({
			previewTheme,
			setPreviewTheme: setPreviewThemeState,
			clearPreviewTheme: () => setPreviewThemeState(undefined),
		}),
		[previewTheme],
	);

	return <ThemePreviewContext.Provider value={value}>{children}</ThemePreviewContext.Provider>;
};
