import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

export type MessageReactionProps = RefAttributes<HTMLDivElement> & {
	/** Highlights a reaction the user added. */
	mine?: boolean;
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

/**
 * One emoji people reacted with and how many did, as a button that adds or removes the user's own reaction.
 */
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
