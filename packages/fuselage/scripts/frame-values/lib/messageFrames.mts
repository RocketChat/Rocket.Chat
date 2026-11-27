import { literal } from './literal.mts';
import type { Value } from './literal.mts';
import { radius, themed } from './tokens.mts';

type Style = Record<string, Value>;

export const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

/** A layout part that sizes like the block or flex item it replaces: a View alone neither shrinks nor has an automatic minimum size. */
export const viewPart = (style: Style): Style => ({
	// Stated in full: the runtime path loads no Tamagui base stylesheet to give a View its flex column
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'stretch',
	flexBasis: 'auto',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	...style,
});

/** A text part that wraps like the element it replaces: a Text alone is pre-wrapped and breaks words. */
export const textPart = (style: Style): Style => ({ whiteSpace: 'inherit', wordWrap: 'inherit', ...style });

export const truncated: Style = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

/** The ring a message part draws around itself for the keyboard focus. It takes no room: an outline and a halo. */
export const focusRing: Style = {
	borderRadius: { 'focus-visible': radius('medium') },
	outlineWidth: { 'focus-visible': 1 },
	outlineStyle: { 'focus-visible': 'solid' },
	outlineColor: { 'focus-visible': themed('stroke-highlight') },
	boxShadow: { 'focus-visible': `0 0 0 3px ${themed('stroke-extra-light-highlight')}` },
};

/** What a text part shows when pressing it does something. */
export const pressable: Style = { cursor: 'pointer', textDecorationLine: { hover: 'underline' } };
