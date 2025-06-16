import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mockMeteorError = class extends Error {
	constructor(
		public error: string,
		public reason: string,
		public details: any,
	) {
		super(reason);
		this.name = 'Meteor.Error';
	}
};

const messagesMock = {
	findForUpdates: sinon.stub(),
	trashFindDeletedAfter: sinon.stub(),
	trashFind: sinon.stub(),
};

const {
	extractTimestampFromCursor,
	mountCursorQuery,
	mountCursorFromMessage,
	mountNextCursor,
	mountPreviousCursor,
	handleWithoutPagination,
	handleCursorPagination,
} = proxyquire.noCallThru().load('../../../../server/publications/messages', {
	'meteor/check': {
		check: sinon.stub(),
	},
	'../../app/lib/server/methods/getChannelHistory': {
		getChannelHistory: sinon.stub(),
	},
	'meteor/meteor': {
		'Meteor': {
			methods: sinon.stub(),
			Error: mockMeteorError,
		},
		'@global': true,
	},
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

		expect(() => mountCursorFromMessage(message, 'DELETED')).to.throw(mockMeteorError, 'Cursor not found');
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

		sinon.assert.calledWith(messagesMock.findForUpdates, rid, { $gt: lastUpdate }, { sort: { ts: -1 } });
		sinon.assert.calledWith(
			messagesMock.trashFindDeletedAfter,
			lastUpdate,
			{ rid },
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
