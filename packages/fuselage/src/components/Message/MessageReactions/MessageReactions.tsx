import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageReactions({ className, ...props }: MessageReactionsProps) {
	return <div {...props} className={cx('rcx-message-reactions__container', className)} />;
}

export default MessageReactions;
