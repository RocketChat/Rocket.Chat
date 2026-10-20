import buttonTokens from '@rocket.chat/fuselage-tokens/dist/button.json';
import type { Keys as IconName } from '@rocket.chat/icons';
import { styled, View, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, ReactNode } from 'react';

import { toCSSColorValue, toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontScale, size, spacing } from '../../styleTokens';
import { Icon } from '../Icon';
import { BubbleLabel, bubbleSegmentVariants } from './BubbleButton';

const buttonColors = buttonTokens.light;

const BubbleItemFrame = styled(View, {
	render: 'span',
	flexDirection: 'row',
	justifyContent: 'center',
	alignItems: 'center',
	flexShrink: 1,
	height: size('x28'),
	paddingInline: spacing('x8'),
	borderRadius: toCSSValue('--rcx-border-radius-extra-large', borderRadius('extra-large')!),
	columnGap: spacing('x4'),
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	...(fontScale('c2') as object),

	variants: {
		secondary: {
			false: {
				color: toCSSValue('--rcx-button-primary-color', toCSSColorValue('button-font-on-primary', buttonColors.fontOnPrimary)),
				backgroundColor: toCSSValue(
					'--rcx-button-primary-background-color',
					toCSSColorValue('button-background-primary-default', buttonColors.backgroundPrimaryDefault),
				),
			},
			true: {
				color: toCSSValue('--rcx-button-secondary-color', toCSSColorValue('button-font-on-secondary', buttonColors.fontOnSecondary)),
				backgroundColor: toCSSValue(
					'--rcx-button-secondary-background-color',
					toCSSColorValue('button-background-secondary-default', buttonColors.backgroundSecondaryDefault),
				),
			},
		},
		small: {
			true: {
				...(fontScale('micro') as object),
				height: size('x20'),
			},
		},
		...bubbleSegmentVariants,
	} as const,

	defaultVariants: {
		secondary: false,
	},
});

type BubbleItemProps = {
	label?: ReactNode;
	secondary?: boolean;
	small?: boolean;
	icon?: IconName;
	segment?: 'first' | 'last';
} & HTMLAttributes<HTMLSpanElement>;

export const BubbleItem = ({ secondary = false, small, segment, label, icon, ...props }: BubbleItemProps) => (
	<BubbleItemFrame
		secondary={secondary}
		small={small}
		className={`rcx-bubble__item ${secondary ? 'rcx-bubble__item--secondary' : 'rcx-bubble__item--primary'}`}
		{...(props as GetProps<typeof BubbleItemFrame>)}
		withIcon={Boolean(icon) && !segment}
		segment={segment}
	>
		{icon && <Icon name={icon} size='x16' marginInlineEnd={8} />}
		{label && <BubbleLabel>{label}</BubbleLabel>}
	</BubbleItemFrame>
);
