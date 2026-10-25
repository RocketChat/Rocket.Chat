import { styled, Text, View } from '@tamagui/web';
import { createElement, type ElementType } from 'react';

import type { ButtonSegment } from './ButtonSegmentContext';
import {
	buttonBorderRadius,
	buttonBorderWidth,
	buttonColors,
	ghostButtonColors,
	type ButtonColors,
	type ButtonKind,
	type GhostKind,
} from './buttonColors';
import { isForcedDisabled } from '../../helpers/isForcedDisabled';
import { borderWidth, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import type { FontScaleName } from '../../styleTokens';

// the token's numeric `fontWeight` is wider than Tamagui's weight union
const font = (name: FontScaleName) => fontScale(name) as object;

const rectangularSize = (height: number, paddingX: number, lineHeightScale: FontScaleName) => ({
	minWidth: `calc(${size(`x${height}`)} * 2)`,
	height: size(`x${height}`),
	paddingBlock: `calc((${size(`x${height}`)} - ${fontScale(lineHeightScale).lineHeight}) / 2 - 2px)`,
	paddingInline: `calc(${spacing(`x${paddingX}`)} - 2px)`,
});

const squaredSize = (side: number) => ({
	width: size(`x${side}`),
	minWidth: size(`x${side}`),
	height: size(`x${side}`),
	paddingBlock: 0,
	paddingInline: 0,
});

export const kindStyle = (colors: ButtonColors) => ({
	color: colors.color,
	borderColor: {
		'default': colors.borderColor,
		'focus-visible': colors.focusBorderColor,
		'hover': colors.hoverBorderColor,
		'press': colors.activeBorderColor,
	},
	backgroundColor: {
		'default': colors.backgroundColor,
		'focus-visible': colors.focusBackgroundColor,
		'hover': colors.hoverBackgroundColor,
		'press': colors.activeBackgroundColor,
	},
	boxShadow: {
		'focus-visible': `0 0 0 ${borderWidth('medium')} ${colors.focusShadowColor}`,
		'hover': 'none',
		'press': 'none',
	},
});

// Disabled colors win over every state, as the `:disabled` rules came last in the SCSS
export const disabledStyle = (colors: ButtonColors) => ({
	cursor: 'not-allowed',
	color: colors.disabledColor,
	borderColor: {
		'default': colors.disabledBorderColor,
		'focus-visible': colors.disabledBorderColor,
		'hover': colors.disabledBorderColor,
		'press': colors.disabledBorderColor,
	},
	backgroundColor: {
		'default': colors.disabledBackgroundColor,
		'focus-visible': colors.disabledBackgroundColor,
		'hover': colors.disabledBackgroundColor,
		'press': colors.disabledBackgroundColor,
	},
});

const byKind = <T,>(style: (colors: ButtonColors) => T) =>
	Object.fromEntries(Object.entries(buttonColors).map(([kind, colors]) => [kind, style(colors)])) as Record<ButtonKind, T>;

const segmentCorners = (start: string | 0, end: string | 0) => ({
	borderStartStartRadius: start,
	borderEndStartRadius: start,
	borderStartEndRadius: end,
	borderEndEndRadius: end,
});

// keeps the focus ring above the adjacent segment
const liftOnFocus = {
	position: { 'focus-visible': 'relative' },
	zIndex: { 'focus-visible': 1 },
} as const;

const transparentInEveryState = {
	'default': 'transparent',
	'focus-visible': 'transparent',
	'hover': 'transparent',
	'press': 'transparent',
};

const ghostStyle = (colors: (typeof ghostButtonColors)[GhostKind]) => ({
	color: colors.color,
	borderColor: transparentInEveryState,
	backgroundColor: {
		'default': 'transparent',
		'focus-visible': colors.focusBackgroundColor,
		'hover': colors.hoverBackgroundColor,
		'press': colors.activeBackgroundColor,
	},
});

export const pressableKinds = ['icon', 'icon-info', 'icon-success', 'icon-warning', 'icon-danger'] as const;

/** Layout, typography and colors of `rcx-button`. */
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
	appearance: 'none',
	borderWidth: buttonBorderWidth,
	borderStyle: 'solid',
	borderRadius: buttonBorderRadius,
	...kindStyle(buttonColors.secondary),

	// Prop order decides which variant wins: `kind`, then `pressed`, then `inactive`
	variants: {
		kind: byKind(kindStyle),
		// Only the default colors: hover, press and focus still show over a pressed button
		pressed: Object.fromEntries(
			pressableKinds.map((kind) => [
				kind,
				{
					borderColor: { default: buttonColors[kind].pressedBorderColor },
					backgroundColor: { default: buttonColors[kind].pressedBackgroundColor },
				},
			]),
		) as Record<(typeof pressableKinds)[number], object>,
		// Not `disabled`: Tamagui would add `aria-disabled`; the value is the kind whose disabled colors apply
		inactive: byKind(disabledStyle),
		size: {
			small: { ...font('c2'), ...rectangularSize(28, 8, 'c1') },
			medium: { ...font('c2'), ...rectangularSize(32, 12, 'c1') },
			large: { ...font('p2'), ...rectangularSize(48, 24, 'p2') },
		},
		compact: {
			true: { minWidth: '4ch' },
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
		// Rounds only the outer corners of a `SplitButton`, rather than clipping the group, which would cut off the focus ring
		segment: {
			first: { ...segmentCorners(buttonBorderRadius, 0), ...liftOnFocus },
			middle: { borderRadius: 0, ...liftOnFocus },
			last: { ...segmentCorners(0, buttonBorderRadius), ...liftOnFocus },
			only: liftOnFocus,
		},
		// Last, as the ghost colors won over the disabled ones too
		ghost: Object.fromEntries(Object.entries(ghostButtonColors).map(([kind, colors]) => [kind, ghostStyle(colors)])) as Record<
			GhostKind,
			ReturnType<typeof ghostStyle>
		>,
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
	variants: {
		badgePosition: {
			'top-end': {},
			'bottom-end': { insetBlockStart: 'auto', insetBlockEnd: 0 },
		},
	} as const,
});

/**
 * The element the frame renders as, carrying `disabled` itself: given to Tamagui, `disabled` would also add
 * `aria-disabled`. Tamagui merges the frame's props into this element.
 */
export const renderButtonElement = (is: ElementType, disabled: boolean | undefined) =>
	createElement(is, disabled === undefined ? {} : { disabled });

/**
 * The color variants in the order they override each other, plus the disabled look the `disabled` class
 * name pins the button to.
 */
export const getButtonStates = (
	className: unknown,
	kind: ButtonKind,
	disabled: boolean | undefined,
	segment: ButtonSegment | undefined,
	pressed?: boolean,
) => {
	const classNames = typeof className === 'string' ? className : undefined;

	return {
		kind,
		pressed: pressed ? pressableKinds.find((pressable) => pressable === kind) : undefined,
		inactive: disabled || isForcedDisabled(classNames) ? kind : undefined,
		segment: segment?.position,
		ghost: segment?.ghost ? segment.variant : undefined,
	};
};
