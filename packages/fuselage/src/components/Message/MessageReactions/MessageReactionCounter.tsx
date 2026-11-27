import { styled, View } from '@tamagui/web';

export type MessageReactionCounterProps = {
	counter: number;
	className?: string;
};

const ReactionCounterFrame = styled(View, {});

const MessageReactionCounter = ({ counter, className }: MessageReactionCounterProps) => (
	<ReactionCounterFrame className={['rcx-message-reactions__counter', className].filter(Boolean).join(' ')} render={<div />}>
		{counter}
	</ReactionCounterFrame>
);

export default MessageReactionCounter;
