import { afterEach, beforeEach, describe, it } from 'node:test';

import { ClientSafeError } from '@rocket.chat/core-services';
import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const messagesMock = {
	findForUpdates: sinon.stub(),
	findForSync: sinon.stub(),
	trashFindDeletedAfter: sinon.stub(),
	trashFind: sinon.stub(),
};

const canAccessRoomIdAsyncStub = sinon.stub().resolves(true);
const getChannelHistoryStub = sinon.stub();

const {
	extractTimestampFromCursor,
	mountCursorQuery,
	mountSyncFilter,
	mountCursorFromMessage,
	mountNextCursor,
	mountPreviousCursor,
	handleWithoutPagination,
	handleCursorPagination,
	getMessageHistory,
} = proxyquire.noCallThru().load('./messages', {
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
		expect(result.options).to.deep.equal({ sort: { _updatedAt: 1, _id: 1 }, limit: 11 });
	});

	it('should return a query with $gt and ascending sort when next is provided', () => {
		const result = mountCursorQuery({ next: mockDate.toString(), count: 10 });
		expect(result.query).to.deep.equal({ $gt: new Date(mockDate) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: 1, _id: 1 }, limit: 10 + 1 });
	});

	it('should return a query with $gt and descending sort when previous is provided', () => {
		const result = mountCursorQuery({ previous: mockDate.toString(), count: 10 });
		expect(result.query).to.deep.equal({ $lt: new Date(mockDate) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: -1, _id: -1 }, limit: 10 + 1 });
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

describe('bounded sync pagination', () => {
	const matches = (row: Record<string, any>, filter: Record<string, any>): boolean =>
		Object.entries(filter).every(([key, value]) => {
			if (key === '$or') return value.some((part: Record<string, any>) => matches(row, part));
			const actual = row[key] instanceof Date ? row[key].getTime() : row[key];
			if (value instanceof Date) return actual === value.getTime();
			return Object.entries(value).every(([operator, bound]) => {
				const expected = bound instanceof Date ? bound.getTime() : (bound as string);
				if (operator === '$gt') return actual > expected;
				if (operator === '$lt') return actual < expected;
				if (operator === '$gte') return actual >= expected;
				return actual <= expected;
			});
		});
	for (const type of ['UPDATED', 'DELETED'] as const) {
		for (const direction of ['next', 'previous'] as const) {
			for (const size of [0, 1, 50, 429, 10000]) {
				it(`bounds ${type} ${direction} pages and returns ${size} tied messages exactly once`, async () => {
					const field = type === 'UPDATED' ? '_updatedAt' : '_deletedAt';
					const rows = Array.from({ length: size }, (_, index) => ({
						_id: `id_${index}`,
						_updatedAt: new Date(size - index),
						[field]: new Date(1000),
					}));
					const read = (filter: Record<string, any>, options: { limit: number; sort: Record<string, number> }) => {
						expect(options.limit).to.equal(51);
						expect(options.sort).to.deep.equal({ [field]: direction === 'next' ? 1 : -1, _id: direction === 'next' ? 1 : -1 });
						const filtered = rows
							.filter((row) => matches(row, filter))
							.sort((a, b) => {
								if (a._id === b._id) return 0;
								return (a._id < b._id ? -1 : 1) * options.sort._id;
							});
						return { toArray: async () => filtered.slice(0, options.limit) };
					};
					messagesMock.findForSync.callsFake((_rid, filter, options) => read(filter, options));
					messagesMock.trashFind.callsFake(({ rid, ...filter }, options) => {
						expect(rid).to.equal('room');
						return read(filter, options);
					});
					let cursor: string | null = direction === 'next' ? '0' : '2000';
					const seen: string[] = [];
					let pages = 0;
					while (cursor !== null) {
						expect(pages++).to.be.lessThan(Math.ceil(size / 50) + 2);
						const result: { updated: IMessage[]; deleted: IMessage[]; cursor: Record<'next' | 'previous', string | null> } =
							await handleCursorPagination(
								type,
								'room',
								50,
								direction === 'next' ? cursor : undefined,
								direction === 'previous' ? cursor : undefined,
							);
						const page = result[type === 'UPDATED' ? 'updated' : 'deleted'];
						expect(page.length).to.be.at.most(50);
						seen.push(...page.map((message) => message._id));
						cursor = result.cursor[direction];
						if (cursor !== null) expect(cursor).to.equal(`1000_${page[page.length - 1]._id}`);
					}
					expect(seen).to.have.lengthOf(size);
					expect(new Set(seen).size).to.equal(size);
				});
			}
		}
	}
	for (const previous of [false, true]) {
		it(`includes the entire starting millisecond for an empty compound ID, previous=${previous}`, () => {
			const filter = mountSyncFilter('_updatedAt', '1000_', previous);
			expect(matches({ _updatedAt: new Date(1000), _id: 'normal-id' }, filter)).to.equal(true);
			expect(matches({ _updatedAt: new Date(previous ? 1001 : 999), _id: 'normal-id' }, filter)).to.equal(false);
		});
	}
	it('rejects an invalid count before querying', async () => {
		for (const count of [0, -1, 1.5, Infinity]) {
			try {
				await handleCursorPagination('UPDATED', 'room', count, '0');
				throw new Error('expected rejection');
			} catch (error) {
				expect(error).to.have.property('error', 'error-invalid-count');
			}
		}
	});
	it('rejects malformed timestamp prefixes', () => {
		for (const cursor of ['_id', '123abc_id', '1.5_id', '9007199254740992_id'])
			expect(() => extractTimestampFromCursor(cursor)).to.throw('Invalid Date');
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
