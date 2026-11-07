import type { IMessage } from '@rocket.chat/core-typings';

import { createDataAPI } from './data';
import { Messages } from '../../stores';
import { getUserId } from '../user';

jest.mock('../SDKClient', () => ({ sdk: { rest: { get: jest.fn() } } }));
jest.mock('../authorization', () => ({ hasAtLeastOnePermission: jest.fn(() => true), hasPermission: jest.fn(() => true) }));
jest.mock('../settings', () => ({ settings: { peek: jest.fn() } }));
jest.mock('../user', () => ({ getUserId: jest.fn() }));
jest.mock('../utils/threadMessageUtils', () => ({ upsertThreadMessageInCache: jest.fn() }));

const rid = 'room-id';
const uid = 'user-id';

const createMessage = (_id: string, ts: Date, extra: Partial<IMessage> = {}): IMessage =>
	({
		_id,
		rid,
		msg: _id,
		ts,
		_updatedAt: ts,
		u: { _id: uid, username: 'user' },
		...extra,
	}) as IMessage;

beforeEach(() => {
	jest.mocked(getUserId).mockReturnValue(uid);
	Messages.state.replaceAll([]);
});

afterEach(() => {
	jest.useRealTimers();
});

describe('findPreviousOwnMessage', () => {
	it('should return the most recent own message', async () => {
		Messages.state.storeMany([createMessage('first', new Date(1_000)), createMessage('second', new Date(2_000))]);

		const message = await createDataAPI({ rid, tmid: undefined }).findPreviousOwnMessage();

		expect(message?._id).toBe('second');
	});

	it('should return the most recent own message even when its timestamp is ahead of the local clock', async () => {
		jest.useFakeTimers({ now: new Date(10_000) });
		Messages.state.storeMany([createMessage('first', new Date(5_000)), createMessage('second', new Date(10_500))]);

		const message = await createDataAPI({ rid, tmid: undefined }).findPreviousOwnMessage();

		expect(message?._id).toBe('second');
	});

	it('should return the own message sent before the given one', async () => {
		const second = createMessage('second', new Date(2_000));
		Messages.state.storeMany([createMessage('first', new Date(1_000)), second, createMessage('third', new Date(3_000))]);

		const message = await createDataAPI({ rid, tmid: undefined }).findPreviousOwnMessage(second);

		expect(message?._id).toBe('first');
	});

	it('should skip messages from other users, other rooms and threads', async () => {
		Messages.state.storeMany([
			createMessage('own', new Date(1_000)),
			createMessage('other-user', new Date(2_000), { u: { _id: 'other-user-id', username: 'other' } }),
			createMessage('other-room', new Date(3_000), { rid: 'other-room-id' }),
			createMessage('thread-reply', new Date(4_000), { tmid: 'own' }),
		]);

		const message = await createDataAPI({ rid, tmid: undefined }).findPreviousOwnMessage();

		expect(message?._id).toBe('own');
	});
});
