import { afterEach, beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const messagesMock = {
	findForUpdates: sinon.stub(),
	trashFindDeletedAfter: sinon.stub(),
	trashFind: sinon.stub(),
};

const canAccessRoomIdAsyncStub = sinon.stub().resolves(true);
const getChannelHistoryStub = sinon.stub();

const {
	extractTimestampFromCursor,
	mountCursorQuery,
	mountCursorFromMessage,
	mountNextCursor,
	mountPreviousCursor,
	handleWithoutPagination,
	handleCursorPagination,
	getMessageHistory,
} = proxyquire.noCallThru().load('./messages', {
	'meteor/check': {
		check: sinon.stub(),
	},
	'../lib/authorization/canAccessRoom': {
		canAccessRoomIdAsync: canAccessRoomIdAsyncStub,
	},
	'../meteor-methods/messages/getChannelHistory': {
		getChannelHistory: getChannelHistoryStub,
	},
	'meteor/meteor': {
		'Meteor': {
			methods: sinon.stub(),
		},
		'@global': true,
	},
	'@rocket.chat/core-services': { ClientSafeError },
	'@rocket.chat/models': {
		Messages: messagesMock,
	},
});

describe('extractTimestampFromCursor', () => {
	it('should return the correct timestamp', () => {
		const cursor = new Date('2024-01-01T00:00:00.000Z').getTime().toString();
		const timestamp = extractTimestampFromCursor(cursor);
		expect(timestamp).to.be.an.instanceOf(Date);
		expect(timestamp.getTime()).to.equal(parseInt(cursor, 10));
	});

	it('should handle non-date compliant string', () => {
		expect(() => extractTimestampFromCursor('not-a-date')).to.throw(Error, 'Invalid Date');
	});
});

describe('mountCursorQuery', () => {
	const mockDate = new Date('2024-01-01T00:00:00.000Z').getTime();

	it('should return a query with $gt when next is provided', () => {
		const result = mountCursorQuery({ next: mockDate.toString() });
		expect(result.query).to.deep.equal({ $gt: new Date(mockDate) });
	});

	it('should return a query with $lt when previous is provided', () => {
		const result = mountCursorQuery({ previous: mockDate.toString() });
		expect(result.query).to.deep.equal({ $lt: new Date(mockDate) });
	});

	it('should return a query with $gt and sort when neither next nor previous is provided', () => {
		const result = mountCursorQuery({ count: 10 });
		expect(result.query).to.deep.equal({ $gt: new Date(0) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: 1 } });
	});

	it('should return a query with $gt and ascending sort when next is provided', () => {
		const result = mountCursorQuery({ next: mockDate.toString(), count: 10 });
		expect(result.query).to.deep.equal({ $gt: new Date(mockDate) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: 1 }, limit: 10 + 1 });
	});

	it('should return a query with $gt and descending sort when previous is provided', () => {
		const result = mountCursorQuery({ previous: mockDate.toString(), count: 10 });
		expect(result.query).to.deep.equal({ $lt: new Date(mockDate) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: -1 }, limit: 10 + 1 });
	});
});

describe('mountCursorFromMessage', () => {
	it('should return the updated timestamp for UPDATED type', () => {
		const message: Pick<IMessage, '_updatedAt'> = {
			_updatedAt: new Date('2024-01-01T00:00:00Z'),
		};

		const result = mountCursorFromMessage(message, 'UPDATED');
		expect(result).to.equal(`${message._updatedAt.getTime()}`);
	});

	it('should return the deleted timestamp for DELETED type', () => {
		const message: Partial<IMessage> & { _deletedAt: Date } = {
			_deletedAt: new Date('2024-01-01T00:00:00Z'),
		};

		const result = mountCursorFromMessage(message, 'DELETED');
		expect(result).to.equal(`${message._deletedAt.getTime()}`);
	});

	it('should throw an error if DELETED type and _deletedAt is not present', () => {
		const message: Pick<IMessage, '_updatedAt'> = {
			_updatedAt: new Date('2024-01-01T00:00:00Z'),
		};

		expect(() => mountCursorFromMessage(message, 'DELETED')).to.throw(ClientSafeError, 'Cursor not found');
	});
});

describe('mountNextCursor', () => {
	const mockMessage = (timestamp: number): Pick<IMessage, '_id' | 'ts' | '_updatedAt'> => ({
		_id: '1',
		ts: new Date(timestamp),
		_updatedAt: new Date(timestamp),
	});

	it('should return null if messages array is empty', () => {
		expect(mountNextCursor([], 10, 'UPDATED')).to.be.null;
	});

	it('should return the first message cursor if previous is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000)];
		expect(mountNextCursor(messages, 10, 'UPDATED', undefined, 'prev')).to.equal('1000');
	});

	it('should return null if messages length is less than or equal to count and next is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000)];
		expect(mountNextCursor(messages, 2, 'UPDATED', 'next')).to.be.null;
	});

	it('should return the second last message cursor if messages length is greater than count and next is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000), mockMessage(3000)];
		expect(mountNextCursor(messages, 2, 'UPDATED', 'next')).to.equal('2000');
	});

	it('should return the last message cursor if no next or previous is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000)];
		expect(mountNextCursor(messages, 10, 'UPDATED')).to.equal('2000');
	});
});

describe('mountPreviousCursor', () => {
	const mockMessage = (timestamp: number): Pick<IMessage, '_id' | 'ts' | '_updatedAt'> => ({
		_id: '1',
		ts: new Date(timestamp),
		_updatedAt: new Date(timestamp),
	});

	it('should return null if messages array is empty', () => {
		expect(mountPreviousCursor([], 10, 'UPDATED')).to.be.null;
	});

	it('should return the first message cursor if messages length is less than or equal to count and next is provided', () => {
		const messages = [mockMessage(1000)];
		expect(mountPreviousCursor(messages, 1, 'UPDATED', 'nextCursor')).to.equal('1000');
	});

	it('should return the first message cursor if messages length is greater than count and next is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000)];
		expect(mountPreviousCursor(messages, 1, 'UPDATED', 'nextCursor')).to.equal('1000');
	});

	it('should return null if messages length is less than or equal to count and previous is provided', () => {
		const messages = [mockMessage(1000)];
		expect(mountPreviousCursor(messages, 1, 'UPDATED', undefined, 'previousCursor')).to.be.null;
	});

	it('should return the second last message cursor if messages length is greater than count and previous is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000), mockMessage(3000)];
		expect(mountPreviousCursor(messages, 2, 'UPDATED', undefined, 'previousCursor')).to.equal('2000');
	});

	it('should return the first message cursor if no next or previous is provided', () => {
		const messages = [mockMessage(1000)];
		expect(mountPreviousCursor(messages, 1, 'UPDATED')).to.equal('1000');
	});
});

describe('handleWithoutPagination', () => {
	afterEach(() => {
		messagesMock.findForUpdates.reset();
		messagesMock.trashFindDeletedAfter.reset();
	});

	it('should return updated and deleted messages', async () => {
		const rid = 'roomId';
		const lastUpdate = new Date();

		const updatedMessages = [{ _id: '1', text: 'Hello' }];
		const deletedMessages = [{ _id: '2', _deletedAt: new Date() }];

		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves(updatedMessages) });
		messagesMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves(deletedMessages) });

		const result = await handleWithoutPagination(rid, lastUpdate);

		expect(result).to.deep.equal({
			updated: updatedMessages,
			deleted: deletedMessages,
		});

		sinon.assert.calledWith(messagesMock.findForUpdates, rid, { updatedAt: { $gt: lastUpdate }, minTs: undefined }, { sort: { ts: -1 } });
		sinon.assert.calledWith(
			messagesMock.trashFindDeletedAfter,
			lastUpdate,
			{ rid },
			{ projection: { _id: 1, _deletedAt: 1 }, sort: { ts: -1 } },
		);
	});

	it('should bound both queries by `ts` when fromTs is provided', async () => {
		const rid = 'roomId';
		const lastUpdate = new Date('2024-01-02T00:00:00.000Z');
		const fromTs = new Date('2024-01-01T00:00:00.000Z');

		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves([]) });
		messagesMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves([]) });

		await handleWithoutPagination(rid, lastUpdate, fromTs);

		sinon.assert.calledWith(messagesMock.findForUpdates, rid, { updatedAt: { $gt: lastUpdate }, minTs: fromTs }, { sort: { ts: -1 } });
		sinon.assert.calledWith(
			messagesMock.trashFindDeletedAfter,
			lastUpdate,
			{ rid, ts: { $gte: fromTs } },
			{ projection: { _id: 1, _deletedAt: 1 }, sort: { ts: -1 } },
		);
	});

	it('should handle empty results', async () => {
		const rid = 'roomId';
		const lastUpdate = new Date();

		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves([]) });
		messagesMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves([]) });

		const result = await handleWithoutPagination(rid, lastUpdate);

		expect(result).to.deep.equal({
			updated: [],
			deleted: [],
		});
	});
});

describe('handleCursorPagination', () => {
	it('should return updated messages and cursor when type is UPDATED', async () => {
		const rid = 'roomId';
		const count = 10;
		const messages = [{ _id: 'msg1', _updatedAt: new Date('2024-01-01T00:00:00Z') }];
		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves(messages) });

		const result = await handleCursorPagination('UPDATED', rid, count);

		expect(messagesMock.findForUpdates.calledOnce).to.be.true;
		// the cursor path has no `ts` bound to apply — it paginates on `_updatedAt` alone
		sinon.assert.calledWith(messagesMock.findForUpdates, rid, { updatedAt: { $gt: new Date(0) } }, { sort: { _updatedAt: 1 } });
		expect(result.updated).to.deep.equal(messages);
		expect(result.cursor).to.have.keys(['next', 'previous']);
	});

	it('should return deleted messages and cursor when type is DELETED', async () => {
		const rid = 'roomId';
		const count = 10;
		const messages = [{ _id: 'msg1', _deletedAt: new Date() }];
		messagesMock.trashFind.returns({ toArray: sinon.stub().resolves(messages) });

		const result = await handleCursorPagination('DELETED', rid, count);

		expect(messagesMock.trashFind.calledOnce).to.be.true;
		expect(result.deleted).to.deep.equal(messages);
		expect(result.cursor).to.have.keys(['next', 'previous']);
	});

	it('should handle empty response correctly', async () => {
		const rid = 'roomId';
		const count = 10;
		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves([]) });

		const result = await handleCursorPagination('UPDATED', rid, count);

		expect(result.updated).to.deep.equal([]);
		expect(result.cursor).to.deep.equal({ next: null, previous: null });
	});
});

describe('getMessageHistory', () => {
	const rid = 'roomId';
	const fromId = 'userId';

	const catchError = async (promise: Promise<unknown>): Promise<any> => {
		try {
			await promise;
		} catch (error) {
			return error;
		}

		throw new Error('expected the call to be rejected');
	};

	beforeEach(() => {
		messagesMock.findForUpdates.reset();
		messagesMock.trashFindDeletedAfter.reset();
		messagesMock.trashFind.reset();
		getChannelHistoryStub.reset();
	});

	it('should reject "fromTs" when combined with cursor pagination', async () => {
		const error = await catchError(getMessageHistory(rid, fromId, { fromTs: new Date(), type: 'UPDATED', next: '1704067200000' }));

		expect(error).to.have.property('error', 'error-fromTs-requires-lastUpdate');
		sinon.assert.notCalled(messagesMock.findForUpdates);
	});

	it('should reject "fromTs" when it would fall through to the channel history', async () => {
		const error = await catchError(getMessageHistory(rid, fromId, { fromTs: new Date() }));

		expect(error).to.have.property('error', 'error-fromTs-requires-lastUpdate');
		sinon.assert.notCalled(getChannelHistoryStub);
	});

	it('should bound the query by "fromTs" when "lastUpdate" is provided', async () => {
		const lastUpdate = new Date('2024-01-02T00:00:00.000Z');
		const fromTs = new Date('2024-01-01T00:00:00.000Z');

		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves([]) });
		messagesMock.trashFindDeletedAfter.returns({ toArray: sinon.stub().resolves([]) });

		await getMessageHistory(rid, fromId, { lastUpdate, fromTs });

		sinon.assert.calledWith(messagesMock.findForUpdates, rid, { updatedAt: { $gt: lastUpdate }, minTs: fromTs }, { sort: { ts: -1 } });
	});
});

describe('handleCursorPagination with messages that share one timestamp', () => {
	type StoredMessage = { _id: string; rid: string; _updatedAt: Date; _deletedAt: Date };
	type Range = { $gt: Date | string } | { $lt: Date | string };

	const sameMs = new Date('2024-01-01T00:00:00.000Z');
	const ids = ['a1', 'a2', 'a3', 'a4', 'a5'];
	const store: StoredMessage[] = [
		{ _id: 'before', rid: 'roomId', _updatedAt: new Date(sameMs.getTime() - 1), _deletedAt: new Date(sameMs.getTime() - 1) },
		...ids.map((_id) => ({ _id, rid: 'roomId', _updatedAt: sameMs, _deletedAt: sameMs })),
		{ _id: 'after', rid: 'roomId', _updatedAt: new Date(sameMs.getTime() + 1), _deletedAt: new Date(sameMs.getTime() + 1) },
	];

	const value = (v: Date | string) => (v instanceof Date ? v.getTime() : v);
	const inRange = (v: Date | string, range: Range | Date | string): boolean => {
		if (range instanceof Date || typeof range === 'string') {
			return value(v) === value(range);
		}
		return '$gt' in range ? value(v) > value(range.$gt) : value(v) < value(range.$lt);
	};
	// Evaluates the subset of the MongoDB filter language that the cursor queries use.
	const matches = (doc: Record<string, any>, filter: Record<string, any>): boolean =>
		Object.entries(filter).every(([key, condition]) =>
			key === '$or' ? condition.some((sub: Record<string, any>) => matches(doc, sub)) : inRange(doc[key], condition),
		);
	const run = (filter: Record<string, any>, options: { sort: Record<string, 1 | -1>; limit?: number }) => {
		const sortKeys = Object.entries(options.sort);
		const rows = store
			.filter((doc) => matches(doc, filter))
			.sort((x: Record<string, any>, y: Record<string, any>) => {
				for (const [key, direction] of sortKeys) {
					const [a, b] = [value(x[key]), value(y[key])];
					if (a !== b) {
						return (a < b ? -1 : 1) * direction;
					}
				}
				return 0;
			});
		return { toArray: async () => rows.slice(0, options.limit ?? rows.length) };
	};

	beforeEach(() => {
		// Same contract as Messages.findForUpdates: an id tie-breaker orders messages inside the boundary timestamp.
		messagesMock.findForUpdates.callsFake(
			(rid: string, { updatedAt, idTieBreaker }: { updatedAt: Range; idTieBreaker?: Range }, options) => {
				const boundary = '$gt' in updatedAt ? updatedAt.$gt : updatedAt.$lt;
				const filter = idTieBreaker
					? { $or: [{ _updatedAt: updatedAt }, { _updatedAt: boundary, _id: idTieBreaker }] }
					: { _updatedAt: updatedAt };
				return run({ rid, ...filter }, options);
			},
		);
		messagesMock.trashFind.callsFake((filter: Record<string, any>, options) => run(filter, options));
	});

	afterEach(() => {
		messagesMock.findForUpdates.reset();
		messagesMock.trashFind.reset();
	});

	const crawl = async (type: 'UPDATED' | 'DELETED', direction: 'next' | 'previous', start: string) => {
		const seen: string[] = [];
		let cursor: string | null = start;
		for (let page = 0; cursor && page < 20; page++) {
			const result: { updated: IMessage[]; deleted: IMessage[]; cursor: Record<'next' | 'previous', string | null> } =
				await handleCursorPagination(
					type,
					'roomId',
					2,
					direction === 'next' ? cursor : undefined,
					direction === 'previous' ? cursor : undefined,
				);
			seen.push(...(type === 'UPDATED' ? result.updated : result.deleted).map((message: IMessage) => message._id));
			cursor = result.cursor[direction];
		}
		return seen;
	};

	it('should return every updated message exactly once when paging forward with a compound cursor', async () => {
		expect(await crawl('UPDATED', 'next', '0_')).to.deep.equal(['before', ...ids, 'after']);
	});

	it('should return every deleted message exactly once when paging forward with a compound cursor', async () => {
		expect(await crawl('DELETED', 'next', '0_')).to.deep.equal(['before', ...ids, 'after']);
	});

	it('should return every updated message exactly once when paging backward with a compound cursor', async () => {
		expect(await crawl('UPDATED', 'previous', `${sameMs.getTime() + 2}_`)).to.deep.equal(['after', ...[...ids].reverse(), 'before']);
	});

	it('should return compound cursors only when the request cursor is compound', async () => {
		const compound = await handleCursorPagination('UPDATED', 'roomId', 2, '0_');
		expect(compound.cursor.next).to.equal(`${sameMs.getTime()}_a1`);

		const legacy = await handleCursorPagination('UPDATED', 'roomId', 2, '0');
		expect(legacy.cursor.next).to.equal(`${sameMs.getTime()}`);
	});

	it('should keep the timestamp-only behavior for a legacy cursor', async () => {
		sinon.assert.notCalled(messagesMock.findForUpdates);
		await handleCursorPagination('UPDATED', 'roomId', 2, '0');
		sinon.assert.calledWith(
			messagesMock.findForUpdates,
			'roomId',
			{ updatedAt: { $gt: new Date(0) } },
			{ sort: { _updatedAt: 1 }, limit: 3 },
		);
	});

	it('should reject a compound cursor whose timestamp part is not a number', async () => {
		const error = await handleCursorPagination('UPDATED', 'roomId', 2, 'abc_a1').catch((e: unknown) => e);
		expect(error).to.be.an.instanceOf(Error);
	});
});
