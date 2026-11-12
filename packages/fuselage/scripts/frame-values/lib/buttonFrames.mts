import type { kindColors } from './buttonPalettes.mts';
import type { Value } from './literal.mts';
import { zIndex } from './tokens.mts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { borderRadius, borderWidth, size } from '../../../src/styleTokens.ts';

type Colors = ReturnType<typeof kindColors>;

const states = ['default', 'focus-visible', 'hover', 'press'];

/** One value for each state the frame follows, in the order the stylesheet gave them: the last one that applies wins. */
export const statesOf = (values: string[]) => Object.fromEntries(states.map((state, index) => [state, values[index]]));

export const buttonBoxShadow = (c: Colors) => ({
	'focus-visible': `0 0 0 ${borderWidth('medium')} ${c.focusShadow}`,
	'hover': 'none',
	'press': 'none',
});

export const paintStyle = (c: Colors): Value => ({
	color: c.color,
	borderColor: statesOf([c.border, c.focusBorder, c.hoverBorder, c.activeBorder]),
	backgroundColor: statesOf([c.background, c.focusBackground, c.hoverBackground, c.activeBackground]),
	boxShadow: buttonBoxShadow(c),
});

/** The disabled colours win over every state, so each state repeats them. */
export const disabledStyle = (c: Colors): Value => ({
	cursor: 'not-allowed',
	color: c.disabledColor,
	borderColor: statesOf(Array(4).fill(c.disabledBorder) as string[]),
	backgroundColor: statesOf(Array(4).fill(c.disabledBackground) as string[]),
	boxShadow: buttonBoxShadow(c),
});

export const squaredSize = (side: number) => ({
	width: size(`x${side}`)!,
	minWidth: size(`x${side}`)!,
	height: size(`x${side}`)!,
	paddingBlock: 0,
	paddingInline: 0,
});

/** What a square button states over a rectangular one; it never grows or shrinks, so a stretching group leaves it alone. */
export const squareLayout = {
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 0,
	flexGrow: 0,
	flexBasis: 'auto',
};

/** What every button and icon button state before any variant: Tamagui's `View` defaults are not the browser's. */
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
	borderWidth: toCSSValue('--rcx-button-border-width', '1px'),
	borderStyle: 'solid',
	borderRadius: toCSSValue('--rcx-button-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
} satisfies Record<string, Value>;

const rounded = buttonChrome.borderRadius;

/** The corners a segment of a `SplitButton` rounds: the group's outer ones, mirrored under right-to-left by the logical names. */
export const segmentVariants = (() => {
	const corners = (startStart: boolean, endStart: boolean, startEnd: boolean, endEnd: boolean) => ({
		borderStartStartRadius: startStart ? rounded : 0,
		borderEndStartRadius: endStart ? rounded : 0,
		borderStartEndRadius: startEnd ? rounded : 0,
		borderEndEndRadius: endEnd ? rounded : 0,
	});

	return {
		only: corners(true, true, true, true),
		first: corners(true, true, false, false),
		middle: corners(false, false, false, false),
		last: corners(false, false, true, true),
	} satisfies Record<string, Value>;
})();

/** A segment with the focus ring rises over its neighbour, which would cover the half of the ring that overlaps it. */
export const segmentRaise = {
	position: { 'focus-visible': 'relative' },
	zIndex: { 'focus-visible': zIndex.raised },
} satisfies Record<string, Value>;

/** The same over a badge, which pins its own position and so needs the frame positioned at rest. */
export const segmentRaiseBadged = {
	overflow: 'visible',
	position: 'relative',
	zIndex: { 'focus-visible': zIndex.raised },
} satisfies Record<string, Value>;
