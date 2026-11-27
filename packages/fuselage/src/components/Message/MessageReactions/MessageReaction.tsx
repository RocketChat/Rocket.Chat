import { styled, View } from '@tamagui/web';
import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

export type MessageReactionProps = RefAttributes<HTMLDivElement> & {
	mine?: boolean;
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

const ReactionFrame = styled(View, {});

function MessageReaction({ mine, children, className, ...props }: MessageReactionProps) {
	return (
		<ReactionFrame
			className={[`rcx-message-reactions__reaction`, mine && 'rcx-message-reactions__reaction--mine', className].filter(Boolean).join(' ')}
			render={<div role='button' tabIndex={0} {...props} />}
		>
			{children}
		</ReactionFrame>
	);
}

export default MessageReaction;
