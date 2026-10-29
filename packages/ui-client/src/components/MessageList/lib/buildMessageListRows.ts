import type { IMessage } from '@rocket.chat/core-typings';

import { isSameDay } from './isSameDay';
import type { SequentialMessageOptions } from './isSequentialMessage';
import { isSequentialMessage } from './isSequentialMessage';

export type MessageListMessageRow<TMessage extends IMessage = IMessage> = {
	kind: 'message';
	key: string;
	message: TMessage;
	previous: TMessage | undefined;
	isSequential: boolean;
	startsNewDay: boolean;
	isFirstUnread: boolean;
};

export type MessageListRow<TMessage extends IMessage = IMessage> =
	| { kind: 'header'; key: typeof HEADER_ROW_KEY }
	| { kind: 'olderLoader'; key: typeof OLDER_LOADER_ROW_KEY }
	| MessageListMessageRow<TMessage>
	| { kind: 'newerLoader'; key: typeof NEWER_LOADER_ROW_KEY };

export const HEADER_ROW_KEY = '@header';
export const OLDER_LOADER_ROW_KEY = '@older-loader';
export const NEWER_LOADER_ROW_KEY = '@newer-loader';

export type MessageListRowsOptions = SequentialMessageOptions & {
	hasOlderMessages: boolean;
	hasNewerMessages: boolean;
	hasHeader: boolean;
	firstUnreadMessageId?: string;
};

export type MessageListRows<TMessage extends IMessage = IMessage> = {
	rows: readonly MessageListRow<TMessage>[];
	keys: readonly string[];
	/** The row index of a message, or `-1` when it is not in the list. */
	indexOfMessage: (messageId: string) => number;
	messageAtIndex: (index: number) => TMessage | undefined;
	/** The row of the first message, which follows the older loader or the header when there is one. */
	firstMessageIndex: number;
	lastIndex: number;
	firstUnreadIndex: number;
};

/**
 * Lays out the rows of a message list: the older loader while older messages remain, otherwise the header; every message
 * with what it needs to render its dividers and grouping; the newer loader while newer messages remain.
 *
 * It is the one place that maps message ids to row indexes.
 */
export const buildMessageListRows = <TMessage extends IMessage>(
	messages: readonly TMessage[],
	{ hasOlderMessages, hasNewerMessages, hasHeader, firstUnreadMessageId, ...sequentialOptions }: MessageListRowsOptions,
): MessageListRows<TMessage> => {
	const rows: MessageListRow<TMessage>[] = [];

	if (hasOlderMessages) {
		rows.push({ kind: 'olderLoader', key: OLDER_LOADER_ROW_KEY });
	} else if (hasHeader) {
		rows.push({ kind: 'header', key: HEADER_ROW_KEY });
	}

	const firstMessageIndex = rows.length;
	const indexes = new Map<string, number>();

	messages.forEach((message, position) => {
		const previous = messages[position - 1];
		indexes.set(message._id, rows.length);
		rows.push({
			kind: 'message',
			key: message._id,
			message,
			previous,
			isSequential: isSequentialMessage(message, previous, sequentialOptions),
			startsNewDay: !previous || !isSameDay(message.ts, previous.ts),
			isFirstUnread: message._id === firstUnreadMessageId,
		});
	});

	if (hasNewerMessages) {
		rows.push({ kind: 'newerLoader', key: NEWER_LOADER_ROW_KEY });
	}

	const indexOfMessage = (messageId: string) => indexes.get(messageId) ?? -1;

	return {
		rows,
		keys: rows.map((row) => row.key),
		indexOfMessage,
		messageAtIndex: (index) => {
			const row = rows[index];
			return row?.kind === 'message' ? row.message : undefined;
		},
		firstMessageIndex,
		lastIndex: rows.length - 1,
		firstUnreadIndex: firstUnreadMessageId ? indexOfMessage(firstUnreadMessageId) : -1,
	};
};
