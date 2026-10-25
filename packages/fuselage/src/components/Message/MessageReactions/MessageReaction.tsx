import { styled, Text, type GetProps } from '@tamagui/web';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

import MessageReactionCounter from './MessageReactionCounter';
import MessageReactionEmoji from './MessageReactionEmoji';
import { strokeColors, surfaceColors, textIconColors } from '../../../Theme';
import { toCSSValue } from '../../../helpers/toCSSValue';
import { borderRadius, borderWidth, spacing } from '../../../styleTokens';
import { withFuselageProvider } from '../../FuselageProvider/FuselageProvider';
import { focusState, plainDiv, textScale } from '../messageStyles';

const reactionBackgroundColor = toCSSValue('--rcx-message-reaction-hover-background-color', surfaceColors['surface-hover']);

export const MessageReactionFrame = styled(Text, {
	...plainDiv,
	...textScale('c1'),
	display: 'inline-flex',
	alignItems: 'center',
	margin: spacing('x2'),
	padding: spacing('x2'),
	cursor: 'pointer',
	color: String(textIconColors['font-hint']),
	...focusState,
	borderWidth: borderWidth('default'),
	borderColor: {
		'default': String(strokeColors['stroke-light']),
		'hover': toCSSValue('--rcx-message-reaction-hover-border-color', strokeColors['stroke-dark']),
		'focus-visible': String(strokeColors['stroke-highlight']),
	},
	borderRadius: {
		'default': toCSSValue('--rcx-message-reaction-border-radius', toCSSValue('--rcx-border-radius-medium', borderRadius('medium'))),
		'focus-visible': focusState.borderRadius['focus-visible'],
	},
	backgroundColor: reactionBackgroundColor,

	variants: {
		mine: {
			true: {
				color: toCSSValue('--rcx-message-reaction-color', textIconColors['font-default']),
				backgroundColor: {
					default: toCSSValue('--rcx-message-reaction-background-color', surfaceColors['surface-selected']),
					hover: reactionBackgroundColor,
				},
			},
		},
		action: {
			true: {
				// Revealed by its message's hover or focus in `Messages.styles.css`
				opacity: 0,
			},
		},
	} as const,
});

export type MessageReactionProps = RefAttributes<HTMLDivElement> & {
	name?: string;
	counter?: number;
	mine?: boolean;
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

function MessageReaction({ name, counter, mine, children, className, ...props }: MessageReactionProps) {
	return (
		<MessageReactionFrame
			mine={mine}
			className={[`rcx-message-reactions__reaction`, mine && 'rcx-message-reactions__reaction--mine', className].filter(Boolean).join(' ')}
			role='button'
			tabIndex={0}
			{...(props as GetProps<typeof MessageReactionFrame>)}
		>
			{children || (
				<>
					{name && <MessageReactionEmoji name={name} />}
					{counter && <MessageReactionCounter counter={counter} />}
				</>
			)}
		</MessageReactionFrame>
	);
}

export default withFuselageProvider(MessageReaction);
