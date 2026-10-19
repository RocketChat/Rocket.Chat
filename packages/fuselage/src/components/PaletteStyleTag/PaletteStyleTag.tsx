import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';
import { dark, highContrast, light } from './lib/themePalettes';
import type { Themes } from './types/themes';

const themes = {
	light,
	dark,
	'high-contrast': highContrast,
};

export type PaletteStyleTagProps = {
	theme?: Themes;
	/**
	 * Default is `main-palette`.
	 */
	tagId?: string;
	/**
	 * Token prefix. Default is `--rcx-color`.
	 */
	prefix?: string;
	/**
	 * Default is `:root`.
	 */
	selector?: string;
	/**
	 * CSS containing custom palette styles to be used.
	 */
	palette?: string;
};

/**
 * Style tag to handle the theme of the application.
 *
 * Import `PaletteStyleTag` and use it on the application informing the desired theme.
 *
 * Toggle the theme on Storybook's Control panel to see the color changes.
 */
function PaletteStyleTag({ theme = 'light', tagId = 'main-palette', prefix = '--rcx-color', selector, palette }: PaletteStyleTagProps) {
	const themePalette = palette || convertToCss(themes[theme], prefix, selector);

	return <>{createPortal(themePalette, useCreateStyleContainer(tagId))}</>;
}

export default memo(PaletteStyleTag);
