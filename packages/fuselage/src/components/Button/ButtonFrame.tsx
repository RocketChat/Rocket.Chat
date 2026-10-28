import {
	buttonBorderRadius,
	buttonBorderWidth,
	buttonColors,
	ghostButtonColors,
	type ButtonColors,
	type ButtonKind,
	type GhostKind,
} from './buttonColors';
import { pressableKinds, type ButtonLook } from './buttonStates';
import { textIconColors } from '../../Theme';
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

// Only the default colors: hover, press and focus still show over a pressed button
const pressedStyle = (colors: ButtonColors) => {
	const style = kindStyle(colors);
	return {
		...style,
		borderColor: { ...style.borderColor, default: colors.pressedBorderColor },
		backgroundColor: { ...style.backgroundColor, default: colors.pressedBackgroundColor },
	};
};

/**
 * Every color combination `getButtonStates` can produce, as one variant: a kind, a pressable kind pressed, or a kind
 * disabled. Separate kind, pressed and disabled variants would also allow combinations no button can reach.
 */
const looks = Object.fromEntries(
	Object.entries(buttonColors).flatMap(([kind, colors]) => [
		[kind, kindStyle(colors)],
		...(pressableKinds.some((pressable) => pressable === kind) ? [[`${kind}-pressed`, pressedStyle(colors)]] : []),
		[`${kind}-disabled`, { ...kindStyle(colors), ...disabledStyle(colors) }],
	]),
) as Record<ButtonLook, ReturnType<typeof kindStyle>>;

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

const sizes = {
	small: { ...font('c2'), ...rectangularSize(28, 8, 'c1') },
	medium: { ...font('c2'), ...rectangularSize(32, 12, 'c1') },
	large: { ...font('p2'), ...rectangularSize(48, 24, 'p2') },
};

const squareStyle = {
	...squaredSize(40),
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 0,
};

const iconStyle = { paddingBlock: 0, paddingInline: 0, lineHeight: 0 };

const squareSizes = {
	mini: squaredSize(20),
	tiny: squaredSize(24),
	small: squaredSize(28),
	medium: squaredSize(32),
	large: squaredSize(40),
};

// Rounds only the outer corners of a `SplitButton`, rather than clipping the group, which would cut off the focus ring
const segments = {
	first: { ...segmentCorners(buttonBorderRadius, 0), ...liftOnFocus },
	middle: { borderRadius: 0, ...liftOnFocus },
	last: { ...segmentCorners(0, buttonBorderRadius), ...liftOnFocus },
	only: liftOnFocus,
};

const ghosts = Object.fromEntries(Object.entries(ghostButtonColors).map(([kind, colors]) => [kind, ghostStyle(colors)]));

const glyphColors = {
	default: { color: String(textIconColors['font-default']) },
	danger: { color: String(textIconColors['font-danger']) },
};

const looksOf = (kinds: readonly ButtonKind[]) =>
	Object.fromEntries(
		Object.entries(looks).filter(([look]) => kinds.some((kind) => [kind, `${kind}-pressed`, `${kind}-disabled`].includes(look))),
	);

type Variant = Record<string, object>;

const isStates = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// A later variant overrides an earlier one state by state: a plain value is the `default` state
const mergeStyles = (earlier: object, later: object) =>
	Object.fromEntries(
		Object.entries({ ...earlier, ...later }).map(([property, value]) => {
			const before = (earlier as Record<string, unknown>)[property];
			if (!(property in earlier) || !(property in later) || (!isStates(before) && !isStates(value))) {
				return [property, value];
			}
			const states = (style: unknown) => (isStates(style) ? style : { default: style });
			return [property, { ...states(before), ...states(value) }];
		}),
	);

/**
 * Every combination of the given variants as one variant, each merged in order the way a later prop overrides an
 * earlier one. Zero-runtime lowers one runtime-chosen variant per CSS property, so variants that set the same
 * properties are chosen together; `variantKey` names a combination.
 */
const combine = (...variants: Variant[]) =>
	variants.reduce<Variant>(
		(combined, variant) =>
			Object.fromEntries(
				Object.entries(combined).flatMap(([key, style]): [string, object][] => [
					[`${key}|`, style],
					...Object.entries(variant).map(([name, value]): [string, object] => [`${key}|${name}`, mergeStyles(style, value)]),
				]),
			),
		{ '': {} },
	);

const buttonKinds = [
	'primary',
	'secondary',
	'danger',
	'warning',
	'success',
	'secondary-danger',
	'secondary-warning',
	'secondary-success',
] as const;

export const iconButtonKinds = [
	'icon',
	'icon-info',
	'icon-success',
	'icon-warning',
	'icon-danger',
	'secondary',
	'primary',
	'success',
	'warning',
	'danger',
] as const;

const frameBase = {
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
};

/** Layout, typography and colors of `rcx-button`. */
export const buttonFrameStyle = {
	...frameBase,
	variants: {
		// size, compact, square, squareSize
		sizing: combine(sizes, { true: { minWidth: '4ch' } }, { true: squareStyle }, squareSizes),
		segment: segments,
		// look, then ghost: the ghost colors won over the disabled ones too
		paint: combine(looksOf(buttonKinds), ghosts),
	},
} as const;

/** `rcx-button` as a square icon button. */
export const iconButtonFrameStyle = {
	...frameBase,
	...squareStyle,
	...iconStyle,
	variants: {
		squareSize: squareSizes,
		// withBadge, then segment
		layer: combine({ true: { position: 'relative', overflow: 'visible' } }, segments),
		// look, then ghost, then the glyph color, which wins over its kind's
		paint: combine(looksOf(iconButtonKinds), ghosts, glyphColors),
	},
} as const;

export const buttonContentStyle = {
	render: 'span',
	display: 'inline-block',
	width: '100%',
	verticalAlign: 'top',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
} as const;

export const buttonBadgeStyle = {
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
} as const;
