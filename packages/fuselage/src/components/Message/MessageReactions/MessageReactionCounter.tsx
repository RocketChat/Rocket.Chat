export type MessageReactionCounterProps = {
	counter: number;
	className?: string;
};

/**
 * How many people reacted with the emoji, in a `MessageReaction`.
 */
const MessageReactionCounter = ({ counter, className }: MessageReactionCounterProps) => (
	<div className={['rcx-message-reactions__counter', className].filter(Boolean).join(' ')}>{counter}</div>
);

export default MessageReactionCounter;
