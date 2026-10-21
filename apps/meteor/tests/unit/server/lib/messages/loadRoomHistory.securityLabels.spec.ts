import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findBefore = sinon.stub();
const findBetween = sinon.stub();
const countBetween = sinon.stub();
const readerAccess = [{ policyId: '2.999.1', classifications: [1, 2, 3], keys: ['2.999.1.2|permissive|840'] }];

const { loadRoomHistory } = proxyquire.noCallThru().load('../../../../../server/lib/messages/loadRoomHistory', {
	'@rocket.chat/models': {
		Messages: {
			findVisibleByRoomIdBeforeTimestampNotContainingTypes: findBefore,
			findVisibleByRoomIdBetweenTimestampsNotContainingTypes: findBetween,
			countVisibleByRoomIdBetweenTimestampsNotContainingTypes: countBetween,
		},
	},
	'../../settings/cached': { settings: { get: () => [] } },
	'../utils/lib/normalizeMessagesForUser': { normalizeMessagesForUser: async (messages: unknown[]) => messages },
	'./securityLabels': { getReaderAccess: async (uid: string) => (uid === 'bob' ? readerAccess : []) },
});

const pageOf = (...timestamps: number[]) => ({
	toArray: async () => timestamps.map((ts, i) => ({ _id: `m${i}`, rid: 'room', ts: new Date(ts) })),
});

describe('loadRoomHistory reader access', () => {
	it('limits the page, the first unread and the unread count to what the reader may read', async () => {
		findBefore.reset();
		findBefore.returns(pageOf(5000, 4000));
		findBetween.reset();
		findBetween.returns(pageOf(3000));
		countBetween.reset();
		countBetween.resolves(1);

		const { unreadNotLoaded } = await loadRoomHistory({ room: { _id: 'room' }, userId: 'bob', lastSeen: new Date(1000), count: 2 });

		expect(unreadNotLoaded).to.equal(1);
		expect(findBefore.firstCall.args.at(-1)).to.equal(readerAccess);
		expect(findBetween.firstCall.args.at(-1)).to.equal(readerAccess);
		expect(countBetween.firstCall.args.at(-1)).to.equal(readerAccess);
	});

	it('matches no labeled message for a reader without clearances', async () => {
		findBefore.reset();
		findBefore.returns(pageOf(5000));

		await loadRoomHistory({ room: { _id: 'room' }, count: 2 });

		expect(findBefore.firstCall.args.at(-1)).to.deep.equal([]);
	});
});
