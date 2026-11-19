import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useThemeMode } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export type AppLayoutThemeWrapperProps = { children: ReactNode };

const AppLayoutThemeWrapper = ({ children }: AppLayoutThemeWrapperProps) => {
	const dark = useDarkMode();
	const theme = useThemeMode();

	/*
	 * Paint the root canvas so mobile browsers fill the overscroll/safe-area regions
	 * (and tint their toolbars) with the theme background instead of falling back to white.
	 */
	useEffect(() => {
		document.documentElement.style.setProperty('background-color', 'var(--rcx-color-surface-tint)');

		return () => {
			document.documentElement.style.removeProperty('background-color');
		};
	}, []);

	return (
		<>
			{/* Keeps mobile browsers' automatic dark mode from recoloring a theme that is already applied. */}
			{createPortal(<meta name='color-scheme' content={theme === 'dark' ? 'dark' : 'only light'} />, document.head)}
			<PaletteStyleTag theme={dark ? 'dark' : 'light'} tagId='app-layout-palette' />
			{children}
		</>
	);
};

export default AppLayoutThemeWrapper;
