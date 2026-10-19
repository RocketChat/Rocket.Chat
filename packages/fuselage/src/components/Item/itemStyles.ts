import type { ElementType } from 'react';

import { textIconColors } from '../../Theme';
import { renderAs } from '../../helpers/renderAs';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale, spacing } from '../../styleTokens';

export const itemColorFontSecondary = toCSSValue('--rcx-item-color-font-secondary', textIconColors['font-secondary-info']);

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
	gap: 'var(--rcx-item-gap)',
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
