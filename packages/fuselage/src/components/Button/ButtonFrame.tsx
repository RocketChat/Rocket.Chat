import { styled, Text, View } from '@tamagui/web';
import { createElement, type ElementType } from 'react';

import { fontFamily, fontScale, size, spacing } from '../../styleTokens';

// the token's numeric `fontWeight` is wider than Tamagui's weight union
const font = (name: string) => fontScale(name) as object;

const rectangularSize = (height: number, paddingX: number, lineHeightScale: string) => ({
	minWidth: `calc(${size(`x${height}`)} * 2)`,
	height: size(`x${height}`),
	paddingBlock: `calc((${spacing(`x${height}`)} - ${fontScale(lineHeightScale)!.lineHeight}) / 2 - 2px)`,
	paddingInline: `calc(${spacing(`x${paddingX}`)} - 2px)`,
});

const squaredSize = (side: number) => ({
	width: size(`x${side}`),
	minWidth: size(`x${side}`),
	height: size(`x${side}`),
	paddingBlock: 0,
	paddingInline: 0,
});

/** Layout and typography of `rcx-button`; colors and interaction states stay in `Button.styles.scss`. */
export const ButtonFrame = styled(View, {
	render: 'button',
	display: 'inline-block',
	flexDirection: 'row',
	flexShrink: 1,
	minHeight: 'auto',
	textAlign: 'center',
	whiteSpace: 'nowrap',
	textDecoration: 'none',
	cursor: 'pointer',
	outlineStyle: 'none',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...font('p2m'),
	...rectangularSize(40, 16, 'p2'),

	variants: {
		size: {
			small: { ...font('c2'), ...rectangularSize(28, 8, 'c1') },
			medium: { ...font('c2'), ...rectangularSize(32, 12, 'c1') },
			large: { ...font('p2'), ...rectangularSize(48, 24, 'p2') },
		},
		square: {
			true: {
				...squaredSize(40),
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				flexShrink: 0,
			},
		},
		icon: {
			true: { paddingBlock: 0, paddingInline: 0, lineHeight: 0 },
		},
		squareSize: {
			mini: squaredSize(20),
			tiny: squaredSize(24),
			small: squaredSize(28),
			medium: squaredSize(32),
			large: squaredSize(40),
		},
		withBadge: {
			true: { position: 'relative', overflow: 'visible' },
		},
	} as const,
});

export const ButtonContent = styled(Text, {
	render: 'span',
	display: 'inline-block',
	width: '100%',
	verticalAlign: 'top',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
});

export const ButtonBadge = styled(View, {
	render: 'span',
	position: 'absolute',
	insetBlockStart: 0,
	insetInlineEnd: 0,
	display: 'flex',
	flexDirection: 'row',
	flexShrink: 1,
	minWidth: 'auto',
	minHeight: 'auto',
	transform: 'translate(30%, -30%)',
});

/**
 * The element the frame renders as, carrying `disabled` itself: given to Tamagui, `disabled` would also add
 * `aria-disabled`. Tamagui merges the frame's props into this element.
 */
export const renderButtonElement = (is: ElementType, disabled: boolean | undefined) =>
	createElement(is, disabled === undefined ? {} : { disabled });
