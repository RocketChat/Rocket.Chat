import type { ElementType } from 'react';

import { statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { renderAs } from '../../helpers/renderAs';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale, spacing } from '../../styleTokens';

export const itemColorFontSecondary = toCSSValue('--rcx-item-color-font-secondary', textIconColors['font-secondary-info']);
export const itemColorSurfaceHover = toCSSValue('--rcx-item-color-surface-hover', surfaceColors['surface-hover']);
export const itemColorSurfaceSelected = toCSSValue('--rcx-item-color-surface-selected', surfaceColors['surface-selected']);
export const itemColorFontDisabled = toCSSValue('--rcx-item-color-font-disabled', textIconColors['font-disabled']);
export const itemColorFontDanger = toCSSValue('--rcx-item-color-font-danger', statusColors['status-font-on-danger']);
export const itemColorStrokeDivider = toCSSValue('--rcx-item-color-stroke-divider', strokeColors['stroke-extra-light']);
const itemColorStrokeFocus = toCSSValue('--rcx-item-color-stroke-focus', strokeColors['stroke-highlight']);

export const itemRowStyle = {
	position: 'relative',
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	flexShrink: 1,
	minWidth: 0,
	minHeight: 'auto',
	margin: 0,
	padding: spacing('x4'),
	listStyle: 'none',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
	borderRadius: toCSSValue('--rcx-border-radius-small', borderRadius('small')!),
	fontFamily: fontFamily('sans'),
} as const;

/** Forced colors drop the box-shadow and paint the transparent outline instead. */
export const focusRing = {
	outlineWidth: borderWidth('medium')!,
	outlineStyle: 'solid',
	outlineColor: 'transparent',
	outlineOffset: `calc(-1 * ${borderWidth('medium')})`,
	boxShadow: `inset 0 0 0 ${borderWidth('medium')} ${itemColorStrokeFocus}`,
} as const;

/** Applies each property of `style` only in the given state clause. */
export const inState = <T extends Record<string, string>>(state: string, style: T) =>
	Object.fromEntries(Object.entries(style).map(([property, value]) => [property, { [state]: value }])) as {
		[K in keyof T]: Record<string, T[K]>;
	};

const highlighted = (color: string) => ({ color, fontWeight: '500' as const });

/** The emphasis of a highlighted row's parts; `sidebar` keeps the sidebar's own theme hook. */
export const highlightVariant = {
	item: highlighted(toCSSValue('--rcx-item-color-font-highlighted', textIconColors['font-titles-labels'])),
	sidebar: highlighted(toCSSValue('--rcx-sidebar-item-color-highlighted', textIconColors['font-titles-labels'])),
} as const;

export type ItemHighlight = keyof typeof highlightVariant;

/** Covers the whole row, so a click anywhere on it reaches the link or button that holds it. */
export const overlayStyle = {
	render: 'span',
	position: 'absolute',
	inset: 0,
	display: 'block',
	borderRadius: 'inherit',
} as const;

export const truncatedTextStyle = {
	overflow: 'hidden',
	flexGrow: 1,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 0,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textOverflow: 'ellipsis',
} as const;

export const centeredSlotStyle = {
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 0,
	flexBasis: 'auto',
	minWidth: 'auto',
	whiteSpace: 'inherit',
	wordWrap: 'inherit',
} as const;

export const textStyle = (name: 'p2' | 'c1' | 'c2') => {
	const { fontWeight, ...rest } = fontScale(name)!;
	return { ...rest, fontWeight: fontWeight as 400 };
};

export const toRender = (is: ElementType) => (typeof is === 'string' ? is : renderAs(is));
