import type { Keys as IconName } from '@rocket.chat/icons';
import { styled, Text, View, type GetProps } from '@tamagui/web';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { isForcedDisabled } from '../../helpers/isForcedDisabled';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, fontFamily, fontScale, size, spacing } from '../../styleTokens';
import { disabledStyle, kindStyle } from '../Button/ButtonFrame';
import { buttonBorderWidth, buttonColors } from '../Button/buttonColors';
import { Icon } from '../Icon';

/** Variants shared by the content and the dismiss segments of a bubble. */
export const bubbleSegmentVariants = {
	// a lone bubble with an icon gets a wider end padding
	withIcon: {
		true: { paddingInlineEnd: spacing('x12') },
	},
	segment: {
		first: { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
		last: { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 },
	},
} as const;

export const BubbleLabel = styled(Text, {
	render: 'span',
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
});

const BubbleButtonFrame = styled(View, {
	render: 'button',
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'center',
	alignItems: 'center',
	flexGrow: 0,
	flexShrink: 1,
	flexBasis: 'auto',
	minWidth: 'auto',
	minHeight: 'auto',
	height: size('x28'),
	margin: 0,
	paddingBlock: 0,
	paddingInline: spacing('x8'),
	columnGap: spacing('x4'),
	overflow: 'hidden',
	textOverflow: 'ellipsis',
	whiteSpace: 'nowrap',
	cursor: 'pointer',
	outlineStyle: 'none',
	appearance: 'none',
	fontFamily: fontFamily('sans'),
	fontVariantNumeric: 'tabular-nums',
	...(fontScale('c2') as object),
	borderWidth: buttonBorderWidth,
	borderStyle: 'solid',
	borderRadius: toCSSValue('--rcx-border-radius-extra-large', borderRadius('extra-large')),
	...kindStyle(buttonColors.primary),

	// Prop order decides which variant wins: `secondary`, then `inactive`
	variants: {
		secondary: {
			true: kindStyle(buttonColors.secondary),
		},
		// Not `disabled`: Tamagui would add `aria-disabled`
		inactive: {
			primary: disabledStyle(buttonColors.primary),
			secondary: disabledStyle(buttonColors.secondary),
		},
		small: {
			true: { ...(fontScale('micro') as object), height: size('x20') },
		},
		...bubbleSegmentVariants,
	} as const,
});

type BubbleButtonProps = {
	onClick: () => void;
	label?: ReactNode;
	secondary?: boolean;
	small?: boolean;
	icon?: IconName;
	segment?: 'first' | 'last';
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>;

export const BubbleButton = ({ secondary, small, segment, label, onClick, icon, className, disabled, ...props }: BubbleButtonProps) => {
	const kind = secondary ? 'secondary' : 'primary';

	return (
		<BubbleButtonFrame
			className={prependClassName(className, `rcx-bubble__button rcx-bubble__button--${kind}`)}
			render={disabled === undefined ? 'button' : <button disabled={disabled} />}
			onClick={onClick}
			{...(props as GetProps<typeof BubbleButtonFrame>)}
			secondary={secondary}
			inactive={disabled || isForcedDisabled(className) ? kind : undefined}
			small={small}
			withIcon={Boolean(icon) && !segment}
			segment={segment}
		>
			{icon && <Icon name={icon} size='x16' />}
			{label && <BubbleLabel>{label}</BubbleLabel>}
		</BubbleButtonFrame>
	);
};
