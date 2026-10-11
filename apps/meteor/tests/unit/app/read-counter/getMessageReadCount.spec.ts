import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const getAccessibleMessageForReadCounter = sandbox.stub();
const countReadersByRoomIdAndMessageTs = sandbox.stub();

const { getMessageReadCount } = p.noCallThru().load('../../../../app/read-counter/server/getMessageReadCount', {
	'./getAccessibleMessageForReadCounter': { getAccessibleMessageForReadCounter },
	'@rocket.chat/models': {
		Subscriptions: { countReadersByRoomIdAndMessageTs },
	},
});

describe('getMessageReadCount', () => {
	beforeEach(() => {
		sandbox.reset();
	});

	it('returns null when the message is not accessible', async () => {
		getAccessibleMessageForReadCounter.resolves(null);

		const result = await getMessageReadCount('m1', 'viewer');

		expect(result).to.equal(null);
		expect(countReadersByRoomIdAndMessageTs.called).to.equal(false);
	});

	it('returns read count excluding the message author', async () => {
		const ts = new Date('2026-01-01T00:00:00.000Z');
		getAccessibleMessageForReadCounter.resolves({
			message: { _id: 'm1', rid: 'r1', ts, u: { _id: 'author' } },
			room: { _id: 'r1', t: 'c' },
		});
		countReadersByRoomIdAndMessageTs.resolves(3);

		const result = await getMessageReadCount('m1', 'viewer');

		expect(result).to.deep.equal({ readCount: 3 });
		expect(countReadersByRoomIdAndMessageTs.calledWith('r1', ts, 'author')).to.equal(true);
	});

	it('returns zero when the message has no timestamp', async () => {
		getAccessibleMessageForReadCounter.resolves({
			message: { _id: 'm1', rid: 'r1', u: { _id: 'author' } },
			room: { _id: 'r1', t: 'c' },
		});

		const result = await getMessageReadCount('m1', 'viewer');

		expect(result).to.deep.equal({ readCount: 0 });
		expect(countReadersByRoomIdAndMessageTs.called).to.equal(false);
	});
});
