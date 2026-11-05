export type MessageReactionCounterProps = {
	counter: number;
	className?: string;
};

const MessageReactionCounter = ({ counter, className }: MessageReactionCounterProps) => (
	<div className={`rcx-message-reactions__counter ${className}`}>{counter}</div>
);

export default MessageReactionCounter;
