import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import { styled, Text, type GetProps } from '@tamagui/web';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

import { statusColors, strokeColors, surfaceColors, textIconColors } from '../../Theme';
import { cx } from '../../helpers/composeClassNames';
import { toCSSColorValue, toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth, fontFamily, fontScale, spacing } from '../../styleTokens';
import type { ElementProps } from '../../types/ElementProps';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

type Variant = NonNullable<TagProps['variant']> | 'default';

const buttonFont = (name: string, value: string) => toCSSColorValue(`button-font-${name}`, value);
const buttonBackground = (name: string, value: string) => toCSSColorValue(`button-background-${name}`, value);

const secondaryBackground = buttonBackground('secondary-default', button.light.backgroundSecondaryDefault);
const secondaryHoverBackground = buttonBackground('secondary-hover', button.light.backgroundSecondaryHover);

const palette: Record<Variant, [color: string, background: string, hoverBackground: string]> = {
	'default': [buttonFont('on-secondary', button.light.fontOnSecondary), secondaryBackground, secondaryHoverBackground],
	'primary': [
		buttonFont('on-primary', button.light.fontOnPrimary),
		buttonBackground('primary-default', button.light.backgroundPrimaryDefault),
		buttonBackground('primary-hover', button.light.backgroundPrimaryHover),
	],
	'secondary': [buttonFont('on-secondary', button.light.fontOnSecondary), secondaryBackground, secondaryHoverBackground],
	'danger': [
		buttonFont('on-danger', button.light.fontOnDanger),
		buttonBackground('danger-default', button.light.backgroundDangerDefault),
		buttonBackground('danger-hover', button.light.backgroundDangerHover),
	],
	'warning': [
		buttonFont('on-warning', colors.n900),
		buttonBackground('warning-default', colors.y400),
		buttonBackground('warning-hover', colors.y500),
	],
	'featured': [
		buttonFont('on-primary', button.light.fontOnPrimary),
		String(surfaceColors['surface-featured']),
		String(surfaceColors['surface-featured-hover']),
	],
	'secondary-danger': [
		buttonFont('on-secondary-danger', button.light.fontOnSecondaryDanger),
		buttonBackground('secondary-danger-default', button.light.backgroundSecondaryDangerDefault),
		buttonBackground('secondary-danger-hover', button.light.backgroundSecondaryDangerHover),
	],
	'secondary-warning': [String(statusColors['status-font-on-warning']), secondaryBackground, secondaryHoverBackground],
	'secondary-info': [String(statusColors['status-font-on-info']), secondaryBackground, secondaryHoverBackground],
};

const tagColors = (variant: Variant) => {
	const [color, background, hoverBackground] = palette[variant];

	return {
		color: toCSSValue(`--rcx-tag-colors-${variant}-color`, color),
		background: toCSSValue(`--rcx-tag-colors-${variant}-background-color`, background),
		hoverBackground: toCSSValue(`--rcx-tag-colors-${variant}-hover-background-color`, hoverBackground),
	};
};

const disabledColor = toCSSValue('--rcx-tag-colors-disabled-color', textIconColors['font-secondary-info']);
const disabledBackground = toCSSValue('--rcx-tag-colors-disabled-background-color', surfaceColors['surface-neutral']);
const focusBorderRadius = toCSSValue('--rcx-border-radius-medium', borderRadius('medium'));
const focusShadow = `0 0 0 ${borderWidth('medium')} ${strokeColors['stroke-extra-light-highlight']}`;

// A clickable tag takes the disabled background but not the disabled color; its colors and focus ring are in `Tag.styles.css`
const schemeStyle = (variant: Variant, clickable: boolean, disabled: boolean) => {
	const { color, background, hoverBackground } = tagColors(variant);

	if (!clickable) {
		return {
			color: disabled ? disabledColor : color,
			backgroundColor: disabled ? disabledBackground : background,
			...(disabled && { cursor: 'not-allowed' }),
		};
	}

	return {
		cursor: disabled ? 'not-allowed' : 'pointer',
		outlineWidth: 0,
		backgroundColor: { default: disabled ? disabledBackground : background, hover: hoverBackground },
	};
};

const hasClassName = (className: unknown, name: string) => typeof className === 'string' && className.split(/\s+/).includes(name);

const variants = Object.keys(palette) as Variant[];

const schemes = Object.fromEntries(
	variants.flatMap((variant) =>
		[false, true].flatMap((clickable) =>
			[false, true].map((disabled) => [`${variant}:${clickable}:${disabled}`, schemeStyle(variant, clickable, disabled)]),
		),
	),
);

const TagFrame = styled(Text, {
	render: 'span',
	display: 'flex',
	flexDirection: 'row',
	flex: '0 1 auto',
	minWidth: 'auto',
	minHeight: 'auto',
	overflow: 'hidden',
	justifyContent: 'center',
	alignItems: 'center',
	gap: spacing('x4'),
	margin: 0,
	paddingBlock: spacing('x2'),
	paddingInline: spacing('x4'),
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textDecorationLine: 'none',
	textOverflow: 'ellipsis',
	wordBreak: 'keep-all',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	borderWidth: borderWidth('default'),
	borderStyle: 'solid',
	borderColor: { 'default': 'transparent', 'focus-visible': String(strokeColors['stroke-highlight']) },
	borderRadius: {
		'default': toCSSValue('--rcx-tag-border-radius', toCSSValue('--rcx-border-radius-small', borderRadius('small'))),
		'focus-visible': focusBorderRadius,
	},
	outlineStyle: 'none',
	boxShadow: { 'focus-visible': focusShadow },
	...(fontScale('micro') as { fontWeight: 700 }),

	variants: {
		scheme: schemes,
		pill: {
			true: {
				borderRadius: {
					'default': toCSSValue('--rcx-border-radius-full', borderRadius('full')),
					'focus-visible': focusBorderRadius,
				},
			},
		},
		size: {
			default: {},
			medium: fontScale('c2') as { fontWeight: 700 },
			large: fontScale('p2b') as { fontWeight: 700 },
		},
	} as const,
});

const TagInner = styled(Text, {
	render: 'span',
	overflow: 'hidden',
	minWidth: 0,
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textOverflow: 'ellipsis',
});

export type TagProps = {
	medium?: boolean;
	large?: boolean;
	/**
	 * Fully rounded shape. Use for interactive tags such as filters
	 */
	pill?: boolean;
	variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'secondary-danger' | 'secondary-warning' | 'secondary-info' | 'featured';
	disabled?: boolean;
	icon?: ReactNode;
} & ElementProps<HTMLElement, AnchorHTMLAttributes<HTMLElement>>;

/**
 * Used for mentions
 */
const Tag = ({ large, medium, pill, className, disabled, onClick, variant, children, icon, href, ...props }: TagProps) => {
	const modifiers = [
		variant,
		medium && 'medium',
		large && 'large',
		pill && 'pill',
		disabled && 'disabled',
		onClick && 'clickable',
		href && 'clickable',
	]
		.filter(Boolean)
		.map((modifier) => `rcx-tag--${modifier}`)
		.join(' ');

	const clickable = !!(onClick || href);

	return (
		<TagFrame
			{...{
				scheme: `${variant ?? 'default'}:${clickable}:${!!disabled}`,
				size: (large && 'large') || (medium && 'medium') || 'default',
				pill,
			}}
			{...({ onClick, href, ...props } as GetProps<typeof TagFrame>)}
			render={href ? 'a' : 'span'}
			className={cx('rcx-tag', modifiers, className)}
			{...(clickable && hasClassName(className, 'disabled') && { cursor: 'not-allowed' })}
		>
			{icon}
			<TagInner className='rcx-tag__inner'>{children}</TagInner>
		</TagFrame>
	);
};

export default withFuselageProvider(Tag);
