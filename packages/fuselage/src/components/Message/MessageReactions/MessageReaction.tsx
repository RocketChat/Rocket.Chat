import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

export type MessageReactionProps = RefAttributes<HTMLDivElement> & {
	mine?: boolean;
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

function MessageReaction({ mine, children, className, ...props }: MessageReactionProps) {
	return (
		<div
			className={[`rcx-message-reactions__reaction`, mine && 'rcx-message-reactions__reaction--mine', className].filter(Boolean).join(' ')}
			role='button'
			tabIndex={0}
			{...props}
		>
			{children}
		</div>
	);
}

export default MessageReaction;
