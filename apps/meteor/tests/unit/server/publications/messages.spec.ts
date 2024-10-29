import type { IMessage } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mockMeteorError = class extends Error {
	constructor(public error: string, public reason: string, public details: any) {
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
		expect(result.options).to.deep.equal({ sort: { ts: -1 } });
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
	it('should return a cursor for the most recent message when messages are present', () => {
		// Messages are already sorted by descending order
		const messages = [{ _updatedAt: new Date('2024-10-01T10:00:00Z') }, { _updatedAt: new Date('2024-10-01T09:00:00Z') }];
		const type = 'UPDATED';
		const result = mountNextCursor(messages, type);
		expect(result).to.equal(`${messages[0]._updatedAt.getTime()}`);
	});

	it('should reverse messages if next is provided', () => {
		// Messages are already sorted by descending order
		const messages = [{ _updatedAt: new Date('2024-10-01T10:00:00Z') }, { _updatedAt: new Date('2024-10-01T09:00:00Z') }];
		const type = 'UPDATED';
		const next = 'someCursor';
		const result = mountNextCursor(messages, type, next);
		expect(result).to.equal(`${messages[0]._updatedAt.getTime()}`);
	});

	it('should return null if no messages and no previous cursor', () => {
		const messages: IMessage[] = [];
		const type = 'UPDATED';
		const result = mountNextCursor(messages, type);
		expect(result).to.equal(null);
	});

	it('should return decremented previous cursor if no messages and previous is provided', () => {
		const messages: IMessage[] = [];
		const type = 'UPDATED';
		const previous = '1000';
		const result = mountNextCursor(messages, type, undefined, previous);
		expect(result).to.equal('999');
	});
});

describe('mountPreviousCursor', () => {
	afterEach(() => {
		messagesMock.findForUpdates.reset();
		messagesMock.trashFindDeletedAfter.reset();
	});

	const mockMessage = (timestamp: number): Pick<IMessage, '_id' | 'ts' | '_updatedAt'> => ({
		_id: '1',
		ts: new Date(timestamp),
		_updatedAt: new Date(timestamp),
	});

	it('should return null if count is null', () => {
		const result = mountPreviousCursor([], 'UPDATED', null);
		expect(result).to.be.null;
	});

	it('should return next + 1 if messages length is 0 and next is provided', () => {
		const result = mountPreviousCursor([], 'UPDATED', 10, '1000');
		expect(result).to.equal('1001');
	});

	it('should return next - 1 if messages length is equal to count and next is provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000)];
		const result = mountPreviousCursor(messages, 'UPDATED', 2, '1000');
		expect(result).to.equal('999');
	});

	it('should return null if messages length is less or equal to count', () => {
		const messages = [mockMessage(1000)];
		const result = mountPreviousCursor(messages, 'UPDATED', 2);
		expect(result).to.be.null;
	});

	it('should return a cursor if messages length is greater than count', () => {
		const messages = [mockMessage(1000), mockMessage(2000), mockMessage(3000)];
		const result = mountPreviousCursor(messages, 'UPDATED', 2);
		expect(result).to.equal('2000');
	});

	it('should return null if messages length is greater than count but count is not provided', () => {
		const messages = [mockMessage(1000), mockMessage(2000), mockMessage(3000)];
		const result = mountPreviousCursor(messages, 'UPDATED');
		expect(result).to.be.null;
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

	it('should pop the last message if response length exceeds count', async () => {
		const rid = 'roomId';
		const count = 1;
		const messages = [
			{ _id: 'msg1', _updatedAt: new Date() },
			{ _id: 'msg2', _updatedAt: new Date() },
		];
		messagesMock.findForUpdates.returns({ toArray: sinon.stub().resolves(messages) });

		const result = await handleCursorPagination('UPDATED', rid, count);

		expect(result.updated).to.have.lengthOf(count);
		expect(result.updated).to.not.include(messages[1]);
	});
});
