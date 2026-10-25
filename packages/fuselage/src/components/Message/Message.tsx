import { styled, View, type GetProps } from '@tamagui/web';
import type { AllHTMLAttributes, RefAttributes } from 'react';

import { MessageContext } from './MessageContext';
import { focusState, textScale, truncatedText } from './messageStyles';
import { statusBackgroundColors, statusColors, surfaceColors, textIconColors } from '../../Theme';
import { prependClassName } from '../../helpers/prependClassName';
import { toCSSValue } from '../../helpers/toCSSValue';
import { spacing } from '../../styleTokens';
import { withFuselageProvider } from '../FuselageProvider/FuselageProvider';

// `!important` keeps them over the highlight animation and over app CSS, as the SCSS did
const important = (value: string) => `${value} !important`;

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
		highlight: {
			true: {
				// The keyframes are in `Messages.styles.css`
				animationName: 'background-fade',
				animationDuration: '6s',
				animationFillMode: 'forwards',
			},
		},
		selected: {
			true: {
				backgroundColor: important(toCSSValue('--rcx-message-background-color-selected', surfaceColors['surface-selected'])),
			},
		},
		editing: {
			true: {
				// The color reads the background hook, as it always did
				color: important(toCSSValue('--rcx-message-background-color-editing', statusColors['status-font-on-warning-2'])),
				backgroundColor: important(
					toCSSValue('--rcx-message-background-color-editing', statusBackgroundColors['status-background-warning-2']),
				),
			},
		},
	} as const,
});

const ThreadMessageFrame = styled(MessageFrame, {
	...textScale('c1'),
	...truncatedText,
	flexDirection: 'column',
	paddingTop: 0,
	paddingBottom: 0,
	color: String(textIconColors['font-info']),

	variants: {
		sequential: {
			true: {
				paddingTop: 0,
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

const createMessage = (Frame: typeof MessageFrame) =>
	function Message({ className, clickable, sequential, isSelected, isEditing, isPending, highlight, children, ...props }: MessageProps) {
		const isClickable = Boolean(clickable || props.onClick);

		return (
			<Frame
				clickable={isClickable}
				sequential={sequential}
				highlight={highlight}
				selected={isSelected}
				editing={isEditing}
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
			>
				<MessageContext.Provider inMessage pending={!!isPending}>
					{children}
				</MessageContext.Provider>
			</Frame>
		);
	};

/** `Message` with the `ThreadMessage` look; only `ThreadMessage` renders it. */
export const ThreadMessageBase = withFuselageProvider(createMessage(ThreadMessageFrame));

export default withFuselageProvider(createMessage(MessageFrame));
