import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findBefore = sinon.stub();

const { loadRoomHistory } = proxyquire.noCallThru().load('../../../../../server/lib/messages/loadRoomHistory', {
	'@rocket.chat/models': { Messages: { findVisibleByRoomIdBeforeTimestampNotContainingTypes: findBefore } },
	'../../settings/cached': { settings: { get: () => [] } },
	'../utils/lib/normalizeMessagesForUser': { normalizeMessagesForUser: async (messages: unknown[]) => messages },
});

const pageOf = (...timestamps: number[]) => ({
	toArray: async () => timestamps.map((ts, i) => ({ _id: `m${i}`, rid: 'room', ts: new Date(ts) })),
});

describe('loadRoomHistory', () => {
	it('should offer the neighbouring pages from the edges of the page returned', async () => {
		findBefore.returns(pageOf(3000, 2000, 1000));

		const { cursor } = await loadRoomHistory({ room: { _id: 'room' }, previous: '5000', count: 2 });

		expect(cursor).to.deep.equal({ next: '3000', previous: '2000' });
	});

	it('should never offer a cursor before 1970', async () => {
		findBefore.returns(pageOf(-836412432, -836413432, -836414432));

		const { messages, cursor } = await loadRoomHistory({ room: { _id: 'room' }, previous: '5000', count: 2 });

		expect(messages).to.have.lengthOf(2);
		expect(cursor).to.deep.equal({ next: '0', previous: null });
	});
});
