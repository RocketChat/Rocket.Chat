import { RoomHistoryManager } from './RoomHistoryManager';
import type { MessageRecord } from '../../../../client/stores/Messages';
import { Messages } from '../../../../client/stores/Messages';

jest.mock('@rocket.chat/emitter');
jest.mock('date-fns');

jest.mock('../../../../client/lib/onClientMessageReceived', () => ({
	onClientMessageReceived: jest.fn((msg) => msg),
}));
jest.mock('../../../../client/lib/user', () => ({
	getUserId: jest.fn(),
}));
jest.mock('../../../../client/lib/utils/callWithErrorHandling', () => ({
	callWithErrorHandling: jest.fn(),
}));
jest.mock('../../../../client/lib/utils/getConfig', () => ({
	getConfig: jest.fn(() => '50'),
}));
jest.mock('../../../../client/lib/utils/waitForElement');
jest.mock('../../../../client/stores', () => {
	const actual = jest.requireActual('../../../../client/stores/Messages');
	return {
		Messages: actual.Messages,
		Subscriptions: {
			state: {
				find: jest.fn(),
			},
		},
	};
});
jest.mock('../../../utils/client', () => ({
	getUserPreference: jest.fn(),
}));

describe('RoomHistoryManager.clear', () => {
	const rid = 'test-room-id';
	const otherRid = 'other-room-id';
	const threadId = 'thread-123';

	const createMessage = (partial: Partial<MessageRecord> & Pick<MessageRecord, '_id' | 'rid'>): MessageRecord =>
		({
			msg: '',
			ts: new Date(),
			_updatedAt: new Date(),
			u: { _id: 'user-id', username: 'test-user', name: 'Test User' },
			...partial,
		}) as MessageRecord;

	const messages: MessageRecord[] = [
		createMessage({ _id: 'msg1', rid, msg: 'Main channel message 1' }),
		createMessage({ _id: 'msg2', rid, msg: 'Main channel message 2' }),
		createMessage({ _id: 'thread-msg-1', rid, tmid: threadId, msg: 'Thread message 1' }),
		createMessage({ _id: 'thread-msg-2', rid, tmid: threadId, msg: 'Thread message 2' }),
		createMessage({ _id: 'other-thread-msg', rid, tmid: 'other-thread-456', msg: 'Other thread message' }),
		createMessage({ _id: 'other-room-msg', rid: otherRid, msg: 'Other room message' }),
		createMessage({ _id: 'other-room-thread', rid: otherRid, tmid: threadId, msg: 'Other room thread message' }),
	];

	beforeEach(() => {
		Messages.state.replaceAll([]);
		Messages.state.storeMany(messages);
		(RoomHistoryManager as any).histories = {};
	});

	it('should remove all messages for a room when no filter is provided', () => {
		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(5);

		RoomHistoryManager.clear(rid);

		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(0);
		expect(Messages.state.filter((m) => m.rid === otherRid).length).toBe(2);
		expect(Messages.state.get('other-room-msg')).toBeDefined();
		expect(Messages.state.get('other-room-thread')).toBeDefined();
	});

	it('should preserve messages that do not match the filter predicate', () => {
		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(5);
		expect(Messages.state.filter((m) => m.rid === otherRid).length).toBe(2);

		RoomHistoryManager.clear(rid, (record: MessageRecord) => !record.tmid || record.tmid !== threadId);

		const remainingMessages = Messages.state.filter((m) => m.rid === rid);
		expect(remainingMessages.length).toBe(2);
		expect(remainingMessages.every((m) => m.tmid === threadId)).toBe(true);
		expect(Messages.state.get('thread-msg-1')).toBeDefined();
		expect(Messages.state.get('thread-msg-2')).toBeDefined();

		expect(Messages.state.get('msg1')).toBeUndefined();
		expect(Messages.state.get('msg2')).toBeUndefined();

		expect(Messages.state.get('other-thread-msg')).toBeUndefined();

		expect(Messages.state.filter((m) => m.rid === otherRid).length).toBe(2);
		expect(Messages.state.get('other-room-msg')).toBeDefined();
		expect(Messages.state.get('other-room-thread')).toBeDefined();
	});

	it('should remove all messages including threads when filter returns true for all', () => {
		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(5);

		RoomHistoryManager.clear(rid, () => true);

		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(0);
	});

	it('should preserve all messages when filter returns false for all', () => {
		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(5);

		RoomHistoryManager.clear(rid, () => false);

		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(5);
		expect(Messages.state.get('msg1')).toBeDefined();
		expect(Messages.state.get('thread-msg-1')).toBeDefined();
	});

	it('should handle empty message store gracefully', () => {
		Messages.state.replaceAll([]);

		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(0);

		expect(() => RoomHistoryManager.clear(rid)).not.toThrow();
		expect(() => RoomHistoryManager.clear(rid, () => true)).not.toThrow();
	});

	it('should not affect messages from other rooms when using a filter', () => {
		RoomHistoryManager.clear(rid, (record: MessageRecord) => !record.tmid);

		expect(Messages.state.filter((m) => m.rid === otherRid).length).toBe(2);
		expect(Messages.state.get('other-room-msg')).toBeDefined();
		expect(Messages.state.get('other-room-thread')).toBeDefined();

		expect(Messages.state.filter((m) => m.rid === rid).length).toBe(3);
		expect(Messages.state.get('thread-msg-1')).toBeDefined();
		expect(Messages.state.get('msg1')).toBeUndefined();
	});
});
