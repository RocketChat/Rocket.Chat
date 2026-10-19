import type { HTMLAttributes, RefAttributes } from 'react';

import MessageBlock from '../MessageBlock';

export type MessageReactionsProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

function MessageReactions(props: MessageReactionsProps) {
	return (
		<MessageBlock className='rcx-message-reactions'>
			<div className='rcx-message-reactions__container' {...props} />
		</MessageBlock>
	);
}

export default MessageReactions;
