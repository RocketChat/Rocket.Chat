import { font } from './frameTokens.mts';
import { itemPalettes } from './itemPalettes.mts';
import type { Value } from './literal.mts';
import { textFrameDefaults } from './textFrameDefaults.mts';
import { webDefaults } from './webDefaults.mts';

const palettes = itemPalettes();

export const textFrame = (style: Record<string, Value>) => {
	const frame = webDefaults(style);
	return { ...textFrameDefaults(frame), ...frame };
};

/** What a part that takes no font of its own reads from the row. */
export const inheritedFont = {
	fontVariantNumeric: 'inherit',
	fontFamily: 'inherit',
	fontSize: 'inherit',
	fontWeight: 'inherit',
	lineHeight: 'inherit',
	letterSpacing: 'inherit',
};

export const highlighted = { color: palettes.font.highlighted, fontWeight: 500 };

/** The base values of the Item parts a Message part spreads: share the values, never the frames. */
export const itemContentBase = webDefaults({
	render: 'div',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'normal',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
});

export const itemRowBase = webDefaults({
	render: 'div',
	display: 'flex',
	alignItems: 'center',
	minWidth: 0,
	gap: 'var(--rcx-item-gap)',
});

export const itemMediaBase = webDefaults({
	render: 'div',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
});

export const itemMetaBase = textFrame({
	render: 'div',
	display: 'block',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
	whiteSpace: 'nowrap',
	color: palettes.font.secondary,
	...inheritedFont,
	...font('c1'),
});
