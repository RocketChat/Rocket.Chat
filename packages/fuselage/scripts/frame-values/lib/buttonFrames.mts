import type { Value } from './literal.mts';
import { offScale, radius, size, themed, zIndex } from './tokens.mts';

type ThemeColor = Parameters<typeof themed>[0];

/** Each Button kind with the color of its focus ring. */
export const kinds = {
	'primary': 'shadow-highlight',
	'secondary': 'shadow-highlight',
	'danger': 'shadow-extra-light-error',
	'secondary-danger': 'shadow-extra-light-error',
	'warning': 'stroke-light',
	'secondary-warning': 'stroke-light',
	'success': 'stroke-light',
	'secondary-success': 'stroke-light',
} as const satisfies Record<string, ThemeColor>;

export type Kind = keyof typeof kinds;

export type Colors = Record<
	| 'color'
	| 'background'
	| 'border'
	| 'hoverBackground'
	| 'hoverBorder'
	| 'activeBackground'
	| 'activeBorder'
	| 'focusBackground'
	| 'focusBorder'
	| 'focusShadow'
	| 'disabledBackground'
	| 'disabledBorder'
	| 'disabledColor',
	string
>;

export const kindColors = (kind: Kind): Colors => ({
	color: themed(`button-font-on-${kind}`),
	background: themed(`button-background-${kind}-default`),
	border: themed(`button-background-${kind}-default`),
	hoverBackground: themed(`button-background-${kind}-hover`),
	hoverBorder: themed(`button-background-${kind}-hover`),
	activeBackground: themed(`button-background-${kind}-press`),
	activeBorder: themed(`button-background-${kind}-press`),
	focusBackground: themed(`button-background-${kind}-focus`),
	focusBorder: themed('stroke-extra-dark'),
	focusShadow: themed(kinds[kind]),
	disabledBackground: themed(`button-background-${kind}-disabled`),
	disabledBorder: themed(`button-background-${kind}-disabled`),
	disabledColor: themed(`button-font-on-${kind}-disabled`),
});

/** One value for each state the frame follows, in the order the stylesheet gave them: the last one that applies wins. */
export const statesOf = ([rest, focus, hover, press]: string[]) => ({ 'default': rest, 'focus-visible': focus, hover, press });

export const focusRing = (color: string) => ({
	'focus-visible': `0 0 0 2px ${color}`,
	'hover': 'none',
	'press': 'none',
});

export const paintStyle = (c: Colors): Record<string, Value> => ({
	color: c.color,
	borderColor: statesOf([c.border, c.focusBorder, c.hoverBorder, c.activeBorder]),
	backgroundColor: statesOf([c.background, c.focusBackground, c.hoverBackground, c.activeBackground]),
	boxShadow: focusRing(c.focusShadow),
});

/** The disabled colors follow no state. */
export const disabledPaint = (c: Colors): Record<string, Value> => ({
	cursor: 'not-allowed',
	color: c.disabledColor,
	borderColor: c.disabledBorder,
	backgroundColor: c.disabledBackground,
});

export const squaredSize = (side: Parameters<typeof size>[0]) => ({
	width: size(side),
	minWidth: size(side),
	height: size(side),
	paddingBlock: 0,
	paddingInline: 0,
});

/** What a square button states over a rectangular one. It never grows or shrinks, so a stretching group leaves it alone. */
export const squareLayout = {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 0,
	flexGrow: 0,
	flexBasis: 'auto',
};

/** What every button and icon button states before any variant: the defaults of a View are not the browser's. */
export const buttonChrome = {
	flexDirection: 'row',
	minHeight: 'auto',
	textAlign: 'center',
	whiteSpace: 'nowrap',
	textDecoration: 'none',
	cursor: 'pointer',
	outlineStyle: 'none',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	borderWidth: offScale(1),
	borderStyle: 'solid',
	borderRadius: radius('medium'),
} satisfies Record<string, Value>;

const corners = (start: boolean, end: boolean) => ({
	borderStartStartRadius: start ? radius('medium') : 0,
	borderEndStartRadius: start ? radius('medium') : 0,
	borderStartEndRadius: end ? radius('medium') : 0,
	borderEndEndRadius: end ? radius('medium') : 0,
});

/** The corners a segment of a SplitButton rounds: the outer ones of the group. */
export const segmentCorners = {
	only: corners(true, true),
	first: corners(true, false),
	middle: corners(false, false),
	last: corners(false, true),
};

/** A segment with the focus ring rises over its neighbour, which would cover the half of the ring that overlaps it. */
export const segmentRaise = {
	position: { 'focus-visible': 'relative' },
	zIndex: { 'focus-visible': zIndex('raised') },
};

/** The same over a badge, which pins its own position and so needs the frame positioned at rest. */
export const segmentRaiseBadged = {
	overflow: 'visible',
	position: 'relative',
	zIndex: { 'focus-visible': zIndex('raised') },
};

/** What a pressed button does to the part that holds its content. */
export const pressNudge = { transform: { 'default': 'none', 'group-press/button': 'translateY(1px)' } };
