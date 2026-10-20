import { style, type StyleRule } from '@vanilla-extract/css';
import { recipe } from '@vanilla-extract/recipes';

import { boxText, lineClamp, textScale, truncatedText } from './messageStyles';
import { statusBackgroundColors, statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, size, spacing } from '../../styleTokens';
import { layered, onHover, text, view } from '../../styles/layers.css';

// `!important` keeps them over the highlight animation and over app CSS, as the SCSS did
const important = (value: string) => `${value} !important`;

const focusVisible = '&:focus-visible, &.focus.focus-visible';

const focusState: StyleRule = {
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: 'transparent',
	selectors: {
		[focusVisible]: {
			borderColor: String(strokeColors['stroke-highlight']),
			borderRadius: toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!),
			outlineWidth: 0,
			boxShadow: `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight']}`,
		},
	},
};

const messageBase = style([
	view,
	layered({
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginInline: spacing('x2'),
		paddingTop: spacing('x8'),
		paddingBottom: spacing('x4'),
		paddingInline: spacing('x20'),
		...focusState,
		...onHover(
			{ backgroundColor: toCSSValue('--rcx-message-background-color-hover', surfaceColors['surface-hover']) },
			'&:hover, &.hover, &.is-hovered',
		),
	}),
]);

export const message = recipe({
	base: messageBase,
	variants: {
		thread: {
			true: layered({
				...textScale('c1'),
				...truncatedText,
				flexDirection: 'column',
				paddingTop: 0,
				paddingBottom: 0,
				color: String(textIconColors['font-info']),
			}),
		},
		clickable: { true: layered({ cursor: 'pointer' }) },
		sequential: { true: {} },
		highlight: {
			true: layered({
				// The keyframes are in `Messages.styles.css`
				animationName: 'background-fade',
				animationDuration: '6s',
				animationFillMode: 'forwards',
			}),
		},
		selected: {
			true: layered({
				backgroundColor: important(toCSSValue('--rcx-message-background-color-selected', surfaceColors['surface-selected'])),
			}),
		},
		editing: {
			true: layered({
				// The color reads the background hook, as it always did
				color: important(toCSSValue('--rcx-message-background-color-editing', statusColors['status-font-on-warning-2'])),
				backgroundColor: important(
					toCSSValue('--rcx-message-background-color-editing', statusBackgroundColors['status-background-warning-2']),
				),
			}),
		},
	},
	compoundVariants: [
		{ variants: { sequential: true, thread: false }, style: layered({ paddingTop: spacing('x4') }) },
	],
	defaultVariants: { thread: false },
});

export const container = recipe({
	base: style([view, layered({ ...boxText, flexGrow: 1, flexShrink: 1, minWidth: 1, marginBlock: spacing('neg-x2'), marginInline: spacing('x4') })]),
	variants: {
		fixed: { true: layered({ alignItems: 'center', flexGrow: 0, flexShrink: 0 }) },
		left: { true: layered({ alignItems: 'flex-end', flexGrow: 0, flexShrink: 0, width: size('x36') }) },
	},
});

export const header = style([view, layered({ ...boxText, flexDirection: 'row', flexGrow: 0, flexShrink: 1, minWidth: 1, marginBlock: spacing('x2') })]);

export const headerWrapper = style([
	view,
	layered({
		...boxText,
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 1,
		marginBlock: spacing('neg-x4'),
		marginInline: spacing('neg-x2'),
	}),
]);

export const nameContainer = recipe({
	base: style([
		text,
		layered({
			...boxText,
			...truncatedText,
			...focusState,
			flexShrink: 0,
			marginInline: spacing('x2'),
			// Must match `MessageName`'s color, or the hover underline mismatches the text under it.
			color: String(textIconColors['font-titles-labels']),
		}),
	]),
	variants: {
		button: {
			true: layered({ cursor: 'pointer', ...onHover({ textDecorationLine: 'underline' }, '&:hover, &.hover, &.is-hovered') }),
		},
	},
});

export const name = style([
	text,
	layered({ ...boxText, ...textScale('h5'), ...truncatedText, flexShrink: 1, color: String(textIconColors['font-titles-labels']) }),
]);

export const username = style([
	text,
	layered({ ...boxText, ...textScale('p2'), ...truncatedText, flexShrink: 1, color: String(textIconColors['font-default']) }),
]);

export const timestamp = style([
	text,
	layered({
		...boxText,
		...textScale('c1'),
		...truncatedText,
		flexShrink: 0,
		marginInline: spacing('x2'),
		// secondary-info fails contrast against the hover surface
		color: String(textIconColors['font-secondary-info']),
		...onHover({ color: String(textIconColors['font-default']) }, `${messageBase}:hover &`),
	}),
]);

const clamped = (lines: number) => layered(lineClamp(lines) as StyleRule);

export const body = recipe({
	base: style([
		text,
		layered({
			display: 'block',
			whiteSpace: 'inherit',
			...textScale('p2'),
			overflow: 'hidden',
			flexShrink: 1,
			marginBlock: spacing('x2'),
			opacity: 1,
			transition: 'opacity 0.3s linear',
			wordBreak: 'break-word',
			color: String(textIconColors['font-default']),
		}),
	]),
	variants: {
		pending: { true: layered({ opacity: 0.4 }) },
		// Clamped at 3, as it always was
		clamp: { 2: clamped(2), 3: clamped(3), 4: clamped(3) },
	},
});
