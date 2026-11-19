import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

/**
 * The reactions under a message: a wrapping row of `MessageReaction`s that ends with a `MessageReactionAction`.
 */
function MessageReactions({ className, ...props }: MessageReactionsProps) {
	return <div {...props} className={cx('rcx-message-reactions__container', className)} />;
}

export default MessageReactions;
