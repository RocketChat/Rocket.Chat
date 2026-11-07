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
		expect(result.options).to.deep.equal({ sort: { _updatedAt: 1 }, batchSize: 10 + 1 });
	});

	it('should return a query with $gt and descending sort when previous is provided', () => {
		const result = mountCursorQuery({ previous: mockDate.toString(), count: 10 });
		expect(result.query).to.deep.equal({ $lt: new Date(mockDate) });
		expect(result.options).to.deep.equal({ sort: { _updatedAt: -1 }, batchSize: 10 + 1 });
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
	beforeEach(() => {
		messagesMock.findForUpdates.reset();
		messagesMock.trashFind.reset();
	});

	for (const type of ['UPDATED', 'DELETED'] as const) {
		for (const direction of ['next', 'previous'] as const) {
			for (const groupSizes of [[], [1], [50], [429], [3, 60, 2], [50, 50, 50]]) {
				it(`should sync all ${type} messages exactly once using ${direction} with timestamp groups ${JSON.stringify(groupSizes)}`, async () => {
					const field = type === 'UPDATED' ? '_updatedAt' : '_deletedAt';
					const source = groupSizes.flatMap((size, group) =>
						Array.from({ length: size }, (_, index) => ({
							_id: `${group}-${index}`,
							// Deliberately reverse update and deletion order to catch sorting on the wrong field.
							_updatedAt: new Date((groupSizes.length - group) * 1000),
							_deletedAt: new Date((groupSizes.length - group) * 1000),
							[field]: new Date((group + 1) * 1000),
						})),
					);
					let closed = 0;
					const read = (query: { $gt: Date } | { $lt: Date }, options: { sort: Record<string, number>; limit?: number }) => {
						expect(options.sort).to.deep.equal({ [field]: direction === 'next' ? 1 : -1 });
						const rows = source
							.filter((message) => ('$gt' in query ? message[field] > query.$gt : message[field] < query.$lt))
							.sort((a, b) => (a[field].getTime() - b[field].getTime()) * options.sort[field]);
						return (async function* () {
							try {
								yield* options.limit ? rows.slice(0, options.limit) : rows;
							} finally {
								closed++;
							}
						})();
					};
					messagesMock.findForUpdates.callsFake((rid, { updatedAt }, options) => {
						expect(rid).to.equal('roomId');
						return read(updatedAt, options);
					});
					messagesMock.trashFind.callsFake(({ rid, _deletedAt }, options) => {
						expect(rid).to.equal('roomId');
						expect(options.projection).to.deep.equal({ _id: 1, _deletedAt: 1 });
						return read(_deletedAt, options);
					});

					let cursor: string | null = direction === 'next' ? '0' : `${(groupSizes.length + 1) * 1000}`;
					const ids: string[] = [];
					let pages = 0;
					while (cursor !== null) {
						expect(pages++).to.be.lessThan(groupSizes.length + 2);
						const result: { updated: IMessage[]; deleted: IMessage[]; cursor: Record<'next' | 'previous', string | null> } =
							await handleCursorPagination(
								type,
								'roomId',
								50,
								direction === 'next' ? cursor : undefined,
								direction === 'previous' ? cursor : undefined,
							);
						const page = type === 'UPDATED' ? result.updated : result.deleted;
						ids.push(...page.map((message: IMessage) => message._id));
						cursor = result.cursor[direction];
						if (cursor !== null) {
							expect(cursor).to.match(/^\d+$/);
							expect(cursor).to.equal(`${page[page.length - 1][field].getTime()}`);
						}
					}
					expect(ids).to.have.lengthOf(source.length);
					expect(new Set(ids).size).to.equal(source.length);
					expect(ids).to.have.members(source.map(({ _id }) => _id));
					expect(closed).to.equal(pages);
				});
			}
		}
	}

	it('should stop after one lookahead message and close the database cursor', async () => {
		let reads = 0;
		const close = sinon.spy();
		messagesMock.findForUpdates.returns(
			(async function* () {
				try {
					for (let index = 1; index <= 1000; index++) {
						reads++;
						yield { _id: `${index}`, _updatedAt: new Date(index) };
					}
				} finally {
					close();
				}
			})(),
		);

		const result = await handleCursorPagination('UPDATED', 'roomId', 1, '0');
		expect(result.updated.map(({ _id }: IMessage) => _id)).to.deep.equal(['1']);
		expect(result.cursor).to.deep.equal({ next: '1', previous: '1' });
		expect(reads).to.equal(2);
		sinon.assert.calledOnce(close);
	});

	it('should return updated messages and cursor when type is UPDATED', async () => {
		const rid = 'roomId';
		const count = 10;
		const messages = [{ _id: 'msg1', _updatedAt: new Date('2024-01-01T00:00:00Z') }];
		messagesMock.findForUpdates.returns(messages);

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
		messagesMock.trashFind.returns(messages);

		const result = await handleCursorPagination('DELETED', rid, count);

		expect(messagesMock.trashFind.calledOnce).to.be.true;
		expect(result.deleted).to.deep.equal(messages);
		expect(result.cursor).to.have.keys(['next', 'previous']);
	});

	it('should handle empty response correctly', async () => {
		const rid = 'roomId';
		const count = 10;
		messagesMock.findForUpdates.returns([]);

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
