import type { HTMLAttributes, ReactNode, RefAttributes } from 'react';

import MessageReactionCounter from './MessageReactionCounter';
import MessageReactionEmoji from './MessageReactionEmoji';

export type MessageReactionProps = RefAttributes<HTMLDivElement> & {
	name?: string;
	counter?: number;
	mine?: boolean;
	children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

function MessageReaction({ name, counter, mine, children, className, ...props }: MessageReactionProps) {
	return (
		<div
			className={[`rcx-message-reactions__reaction`, mine && 'rcx-message-reactions__reaction--mine', className].filter(Boolean).join(' ')}
			role='button'
			tabIndex={0}
			{...props}
		>
			{children || (
				<>
					{name && <MessageReactionEmoji name={name} />}
					{counter && <MessageReactionCounter counter={counter} />}
				</>
			)}
		</div>
	);
}

export default MessageReaction;
