import type { HTMLAttributes, RefAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';
import MessageBlock from '../MessageBlock';

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageReactions({ className, ...props }: MessageReactionsProps) {
	return (
		<MessageBlock className='rcx-message-reactions'>
			<div {...props} className={cx('rcx-message-reactions__container', className)} />
		</MessageBlock>
	);
}

export default MessageReactions;
