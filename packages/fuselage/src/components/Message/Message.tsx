import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { focusState } from './messageStyles';
import { surfaceColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

const MessageFrame = styled(View, {
	render: 'div',
	position: 'relative',
	flexDirection: 'row',
	alignItems: 'flex-start',
	marginInline: spacing('x2'),
	paddingTop: spacing('x8'),
	paddingBottom: spacing('x4'),
	paddingInline: spacing('x20'),
	...focusState,
	backgroundColor: { hover: toCSSValue('--rcx-message-background-color-hover', surfaceColors['surface-hover']) },

	variants: {
		clickable: {
			true: {
				cursor: 'pointer',
			},
		},
		sequential: {
			true: {
				paddingTop: spacing('x4'),
			},
		},
	} as const,
});

export type MessageProps = AllHTMLAttributes<HTMLDivElement> &
	RefAttributes<HTMLDivElement> & {
		clickable?: boolean;
		sequential?: boolean;
		className?: string;
		isSelected?: boolean;
		isEditing?: boolean;
		isPending?: boolean;
		highlight?: boolean;
	};

function Message({ className, clickable, sequential, isSelected, isEditing, isPending, highlight, ...props }: MessageProps) {
	const isClickable = Boolean(clickable || props.onClick);

	return (
		<MessageFrame
			clickable={isClickable}
			sequential={sequential}
			className={prependClassName(
				className,
				[
					'rcx-message',
					isClickable && 'rcx-message--clickable',
					sequential && 'rcx-message--sequential',
					isSelected && 'rcx-message--selected',
					isEditing && 'rcx-message--editing',
					isPending && 'rcx-message--pending',
					highlight && 'rcx-message--highlight',
				]
					.filter(Boolean)
					.join(' '),
			)}
			{...(props as GetProps<typeof MessageFrame>)}
		/>
	);
}

export default withFuselageProvider(Message);
