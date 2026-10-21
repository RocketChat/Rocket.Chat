import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findBefore = sinon.stub();

const label = { policyId: '2.999.1', classification: 4, categories: [] };

const { loadRoomHistory } = proxyquire.noCallThru().load('../../../../../server/lib/messages/loadRoomHistory', {
	'@rocket.chat/models': { Messages: { findVisibleByRoomIdBeforeTimestampNotContainingTypes: findBefore } },
	'../../settings/cached': { settings: { get: () => [] } },
	'../utils/lib/normalizeMessagesForUser': { normalizeMessagesForUser: async (messages: unknown[]) => messages },
	'./securityLabels': {
		prepareMessagesForReader: async (messages: Array<{ securityLabel?: unknown }>) =>
			messages.filter(({ securityLabel }) => !securityLabel),
	},
});

// Each entry is a timestamp; negative ones mark messages the reader may not read.
const pageOf = (...entries: number[]) => ({
	toArray: async () =>
		entries.map((entry, i) => ({ _id: `m${i}`, rid: 'room', ts: new Date(Math.abs(entry)), ...(entry < 0 && { securityLabel: label }) })),
});

describe('loadRoomHistory with messages the reader may not read', () => {
	it('leaves them out and keeps their timestamps out of the cursors', async () => {
		findBefore.reset();
		findBefore.onFirstCall().returns(pageOf(4000, -3000, 2000));
		findBefore.onSecondCall().returns(pageOf(-1500));
		findBefore.onThirdCall().returns(pageOf());

		const { messages, cursor } = await loadRoomHistory({ room: { _id: 'room' }, previous: '5000', count: 2 });

		expect(messages.map(({ ts }: { ts: Date }) => ts.getTime())).to.deep.equal([4000, 2000]);
		// The oldest record scanned is unreadable, so the page ends at the oldest readable one instead
		expect(cursor).to.deep.equal({ next: '4000', previous: null });
	});

	it('keeps scanning past a page that only holds unreadable messages', async () => {
		findBefore.reset();
		findBefore.onFirstCall().returns(pageOf(-4000, -3000, -2500));
		findBefore.onSecondCall().returns(pageOf(2000, 1000, 500));

		const { messages, cursor } = await loadRoomHistory({ room: { _id: 'room' }, previous: '5000', count: 2 });

		expect(messages.map(({ ts }: { ts: Date }) => ts.getTime())).to.deep.equal([2000, 1000]);
		expect(cursor).to.deep.equal({ next: '2000', previous: '1000' });
		expect(findBefore.secondCall.args[1].getTime()).to.equal(2500);
	});
});
