import { strokeColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale } from '../../styleTokens';

export const focusState = {
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: { 'default': 'transparent', 'focus-visible': String(strokeColors['stroke-highlight']) },
	borderRadius: { 'focus-visible': toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!) },
	outlineWidth: { 'focus-visible': 0 },
	boxShadow: { 'focus-visible': `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight']}` },
} as const;

export const truncatedText = {
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
} as const;

/** The inherited text properties `rcx-box rcx-box--full` used to set. */
export const boxText = {
	fontFamily: fontFamily('sans'),
	fontVariant: 'tabular-nums',
} as const;

/** Undoes Tamagui's `Text` base so a `Text` frame lays out like a plain `div`. */
export const plainDiv = {
	render: 'div',
	display: 'block',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	boxSizing: 'content-box',
} as const;

export const textScale = (name: string) => {
	const { fontWeight, ...scale } = fontScale(name)!;
	return { ...scale, fontWeight: fontWeight as 400 };
};

/** Clamps text to `lines` lines; Tamagui emits the `-webkit-` props but doesn't type them, hence the cast. */
export const lineClamp = (lines: number) =>
	({
		display: '-webkit-box',
		overflow: 'hidden',
		WebkitBoxOrient: 'vertical',
		WebkitLineClamp: lines,
	}) as unknown as { overflow: 'hidden' };
