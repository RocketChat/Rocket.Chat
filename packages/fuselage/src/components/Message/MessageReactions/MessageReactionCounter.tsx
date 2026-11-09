export type MessageReactionCounterProps = {
	counter: number;
	className?: string;
};

const MessageReactionCounter = ({ counter, className }: MessageReactionCounterProps) => (
	<div className={['rcx-message-reactions__counter', className].filter(Boolean).join(' ')}>{counter}</div>
);

export default MessageReactionCounter;
