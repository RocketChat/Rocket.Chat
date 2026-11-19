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
	/** Id of the `style` element the palette is written to; each `PaletteStyleTag` on a page needs its own. */
	tagId?: string;
	/** Prefix of the custom property names; Fuselage components read `--rcx-color`. */
	prefix?: string;
	/** Elements the palette applies to, as a CSS selector, to theme part of the page; the whole page by default. */
	selector?: string;
	/** CSS to write in place of the theme's palette; `theme`, `prefix` and `selector` are then ignored. */
	palette?: string;
};

/**
 * Sets the colors Fuselage components use to the palette of a theme: `light`, `dark` or `high-contrast`. Render
 * another one, with its own `tagId` and a `selector`, to give part of the page a different theme.
 */
function PaletteStyleTag({ theme = 'light', tagId = 'main-palette', prefix = '--rcx-color', selector, palette }: PaletteStyleTagProps) {
	const themePalette = palette || convertToCss(themes[theme], prefix, selector);

	return <>{createPortal(themePalette, useCreateStyleContainer(tagId))}</>;
}

export default memo(PaletteStyleTag);
