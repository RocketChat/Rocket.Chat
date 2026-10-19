import { styled, Text, type GetProps } from '@tamagui/web';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';

import { badgeBackgroundColors, textIconColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { renderAs } from '../../helpers/renderAs';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const badgeColors = (name: string, level: keyof typeof badgeBackgroundColors) => ({
	color: toCSSValue(`--rcx-badge-colors-${name}-color`, textIconColors['font-pure-white']),
	backgroundColor: toCSSValue(`--rcx-badge-colors-${name}-background-color`, badgeBackgroundColors[level]),
});

const BadgeFrame = styled(Text, {
	render: 'span',
	display: 'flex',
	flex: '0 1 auto',
	overflow: 'hidden',
	justifyContent: 'center',
	width: 'fit-content',
	minWidth: size('x16'),
	minHeight: size('x16'),
	paddingBlock: spacing('x2'),
	paddingInline: spacing('x4'),
	borderWidth: 0,
	borderStyle: 'solid',
	borderColor: 'currentColor',
	outline: 'none',
	textAlign: 'center',
	whiteSpace: 'nowrap',
	wordWrap: 'inherit',
	textDecorationLine: 'none',
	textOverflow: 'ellipsis',
	wordBreak: 'keep-all',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	borderRadius: toCSSValue('--rcx-badge-border-radius', toCSSValue('--rcx-border-radius-full', borderRadius('full')!)),
	...(fontScale('micro') as { fontWeight: 700 }),

	variants: {
		variant: {
			primary: badgeColors('primary', 'badge-background-level-2'),
			secondary: badgeColors('secondary', 'badge-background-level-1'),
			warning: badgeColors('warning', 'badge-background-level-3'),
			danger: badgeColors('danger', 'badge-background-level-4'),
		},
		small: {
			true: {
				minWidth: size('x8'),
				minHeight: size('x8'),
			},
		},
	} as const,
});

export type BadgeProps = {
	is?: ElementType<HTMLAttributes<HTMLSpanElement>>;
	variant?: 'secondary' | 'primary' | 'danger' | 'warning';
	small?: boolean;
	className?: string;
	children?: ReactNode;
	title?: string;
} & HTMLAttributes<HTMLSpanElement>;

/**
 * Communicates notification’s amount and types.
 */
function Badge({ is, variant = 'secondary', small, className, ...props }: BadgeProps) {
	const modifiers = [variant, small && 'small']
		.filter(Boolean)
		.map((modifier) => `rcx-badge--${modifier}`)
		.join(' ');

	return (
		<BadgeFrame
			variant={variant}
			small={small}
			className={prependClassName(className, `rcx-badge ${modifiers}`)}
			render={!is || typeof is === 'string' ? is : renderAs(is)}
			{...(props as GetProps<typeof BadgeFrame>)}
		/>
	);
}

export default withFuselageProvider(Badge);
