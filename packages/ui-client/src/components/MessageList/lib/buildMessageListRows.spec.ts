import { createFakeMessage } from '@rocket.chat/mock-providers';

import { buildMessageListRows, HEADER_ROW_KEY, NEWER_LOADER_ROW_KEY, OLDER_LOADER_ROW_KEY } from './buildMessageListRows';

const options = { groupingPeriodSeconds: 300, hasOlderMessages: false, hasNewerMessages: false, hasHeader: false };

const messages = [
	createFakeMessage({ _id: 'a', ts: new Date(2024, 0, 14, 10, 0) }),
	createFakeMessage({ _id: 'b', ts: new Date(2024, 0, 15, 10, 0) }),
	createFakeMessage({ _id: 'c', ts: new Date(2024, 0, 15, 10, 1) }),
];

describe('buildMessageListRows', () => {
	it('should render one row per message when there is nothing around them', () => {
		const { keys, firstMessageIndex, lastIndex } = buildMessageListRows(messages, options);

		expect(keys).toEqual(['a', 'b', 'c']);
		expect(firstMessageIndex).toBe(0);
		expect(lastIndex).toBe(2);
	});

	it('should put the older loader first while older messages remain, instead of the header', () => {
		const { keys } = buildMessageListRows(messages, { ...options, hasOlderMessages: true, hasHeader: true });

		expect(keys).toEqual([OLDER_LOADER_ROW_KEY, 'a', 'b', 'c']);
	});

	it('should put the header first once no older messages remain', () => {
		const { keys } = buildMessageListRows(messages, { ...options, hasHeader: true });

		expect(keys).toEqual([HEADER_ROW_KEY, 'a', 'b', 'c']);
	});

	it('should put the newer loader last while newer messages remain', () => {
		const { keys } = buildMessageListRows(messages, { ...options, hasNewerMessages: true });

		expect(keys).toEqual(['a', 'b', 'c', NEWER_LOADER_ROW_KEY]);
	});

	it('should map ids to row indexes and back across the rows around the messages', () => {
		const rows = buildMessageListRows(messages, { ...options, hasHeader: true, hasNewerMessages: true });

		expect(rows.indexOfMessage('a')).toBe(1);
		expect(rows.indexOfMessage('c')).toBe(3);
		expect(rows.indexOfMessage('missing')).toBe(-1);
		expect(rows.messageAtIndex(0)).toBeUndefined();
		expect(rows.messageAtIndex(1)?._id).toBe('a');
		expect(rows.messageAtIndex(4)).toBeUndefined();
		expect(rows.firstMessageIndex).toBe(1);
		expect(rows.lastIndex).toBe(4);
	});

	it('should mark day boundaries, grouping and the first unread message on the message rows', () => {
		const { rows, firstUnreadIndex } = buildMessageListRows(messages, { ...options, firstUnreadMessageId: 'c' });

		expect(rows).toMatchObject([
			{ kind: 'message', key: 'a', startsNewDay: true, isSequential: false, isFirstUnread: false, previous: undefined },
			{ kind: 'message', key: 'b', startsNewDay: true, isSequential: false, isFirstUnread: false, previous: messages[0] },
			{ kind: 'message', key: 'c', startsNewDay: false, isSequential: true, isFirstUnread: true, previous: messages[1] },
		]);
		expect(firstUnreadIndex).toBe(2);
	});

	it('should report no first unread row when the unread message is not loaded', () => {
		expect(buildMessageListRows(messages, { ...options, firstUnreadMessageId: 'z' }).firstUnreadIndex).toBe(-1);
		expect(buildMessageListRows(messages, options).firstUnreadIndex).toBe(-1);
	});

	it('should render an empty list with its header only', () => {
		const { keys, lastIndex, firstMessageIndex } = buildMessageListRows([], { ...options, hasHeader: true });

		expect(keys).toEqual([HEADER_ROW_KEY]);
		expect(lastIndex).toBe(0);
		expect(firstMessageIndex).toBe(1);
	});
});
