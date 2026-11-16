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

type MessageRowContentProps<TMessage extends IMessage> = {
	row: MessageListMessageRow<TMessage>;
	renderMessage: (row: MessageListMessageRow<TMessage>) => ReactNode;
};

/** A message row is drawn again only when what it shows changed: the rows are rebuilt on every change of the messages. */
const hasSameContent = <TMessage extends IMessage>(
	{ row: previous, renderMessage: previousRender }: MessageRowContentProps<TMessage>,
	{ row: next, renderMessage: nextRender }: MessageRowContentProps<TMessage>,
) =>
	previousRender === nextRender &&
	previous.key === next.key &&
	previous.message === next.message &&
	previous.previous === next.previous &&
	previous.isSequential === next.isSequential &&
	previous.startsNewDay === next.startsNewDay &&
	previous.isFirstUnread === next.isFirstUnread;

const MessageRowContent = memo(
	<TMessage extends IMessage>({ row, renderMessage }: MessageRowContentProps<TMessage>) => (
		<>
			{(row.startsNewDay || row.isFirstUnread) && (
				<MessageListDivider day={row.startsNewDay ? row.message.ts : undefined} isFirstUnread={row.isFirstUnread} />
			)}
			{renderMessage(row)}
		</>
	),
	hasSameContent,
) as <TMessage extends IMessage>(props: MessageRowContentProps<TMessage>) => ReactNode;

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
					<MessageRowContent row={row} renderMessage={renderMessage} />
				</div>
			);
	}
};

export default MessageListRow;
