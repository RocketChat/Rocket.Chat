import { PaletteStyleTag } from '@rocket.chat/fuselage';
import type { PaletteStyleTagProps } from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/fuselage-hooks';
import { useThemeMode } from '@rocket.chat/ui-client';
import type { ReactNode } from 'react';

type PinnedTheme = PaletteStyleTagProps['theme'];

export type AppLayoutThemeWrapperProps = {
	children: ReactNode;
	/**
	 * Pins the palette instead of following the reader's appearance preference — for a layout whose look is part
	 * of what it is rather than a matter of taste. The conference window is the one that pins: a call surface is
	 * dark in every product that has one, and light controls over a black video tile read as a bug rather than
	 * as a light theme.
	 *
	 * High contrast is the exception a pin never overrides. Unlike light and dark it answers a legibility need,
	 * so it outranks whatever look a layout wants.
	 */
	theme?: PinnedTheme;
};

/**
 * Left unpinned this is exactly the light/dark the tag has always emitted, so every other route's palette is
 * untouched: only a pinned layout consults the appearance preference at all, and only to let high contrast
 * through.
 */
const resolveTheme = (pinned: PinnedTheme, mode: ReturnType<typeof useThemeMode>, dark: boolean): PinnedTheme => {
	if (!pinned) {
		return dark ? 'dark' : 'light';
	}

	if (mode === 'high-contrast') {
		return 'high-contrast';
	}

	return pinned;
};

const AppLayoutThemeWrapper = ({ children, theme: pinned }: AppLayoutThemeWrapperProps) => {
	const dark = useDarkMode();
	const mode = useThemeMode();

	const theme = resolveTheme(pinned, mode, dark);

	return (
		<>
			<PaletteStyleTag theme={theme} tagId='app-layout-palette' />
			{children}
		</>
	);
};

export default AppLayoutThemeWrapper;
