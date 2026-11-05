import type { IMessage } from '@rocket.chat/core-typings';
import type { ReactNode } from 'react';
import { memo } from 'react';

import MessageListDivider from './MessageListDivider';
import MessageListLoader from './MessageListLoader';
import type { MessageListMessageRow, MessageListRow as Row } from './lib/buildMessageListRows';

export type MessageListRowProps<TMessage extends IMessage> = {
	row: Row<TMessage>;
	index: number;
	header: ReactNode;
	isLoadingOlderMessages: boolean;
	isLoadingNewerMessages: boolean;
	renderMessage: (row: MessageListMessageRow<TMessage>) => ReactNode;
};

const MessageListRow = <TMessage extends IMessage>({
	row,
	index,
	header,
	isLoadingOlderMessages,
	isLoadingNewerMessages,
	renderMessage,
}: MessageListRowProps<TMessage>) => {
	switch (row.kind) {
		case 'header':
			return (
				<div role='listitem' data-row-index={index}>
					{header}
				</div>
			);

		case 'olderLoader':
			return <MessageListLoader isLoading={isLoadingOlderMessages} />;

		case 'newerLoader':
			return <MessageListLoader isLoading={isLoadingNewerMessages} />;

		case 'message':
			return (
				<div data-row-index={index} data-message-id={row.message._id}>
					{(row.startsNewDay || row.isFirstUnread) && (
						<MessageListDivider day={row.startsNewDay ? row.message.ts : undefined} isFirstUnread={row.isFirstUnread} />
					)}
					{renderMessage(row)}
				</div>
			);
	}
};

export default memo(MessageListRow) as typeof MessageListRow;
