import type { kindColors } from './buttonPalettes.mts';
import type { Value } from './literal.mts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { borderRadius, borderWidth, fontScale, size, type FontScaleName } from '../../../src/styleTokens.ts';

export const font = (name: FontScaleName) => fontScale(name) as unknown as Record<string, Value>;

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
