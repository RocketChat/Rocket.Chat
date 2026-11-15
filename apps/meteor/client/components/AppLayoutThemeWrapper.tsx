import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

export type AppLayoutThemeWrapperProps = { children: ReactNode };

const AppLayoutThemeWrapper = ({ children }: AppLayoutThemeWrapperProps) => {
	const dark = useDarkMode();

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
			<PaletteStyleTag theme={dark ? 'dark' : 'light'} tagId='app-layout-palette' />
			{children}
		</>
	);
};

export default AppLayoutThemeWrapper;
