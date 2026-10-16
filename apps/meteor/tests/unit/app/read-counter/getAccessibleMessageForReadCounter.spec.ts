import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const findOneByIdMessage = sandbox.stub();
const findOneByIdRoom = sandbox.stub();
const canReadRoom = sandbox.stub();

const { getAccessibleMessageForReadCounter } = p.noCallThru().load('../../../../app/read-counter/server/getAccessibleMessageForReadCounter', {
	'@rocket.chat/core-services': { Authorization: { canReadRoom } },
	'@rocket.chat/models': {
		Messages: { findOneById: findOneByIdMessage },
		Rooms: { findOneById: findOneByIdRoom },
	},
});

describe('getAccessibleMessageForReadCounter', () => {
	beforeEach(() => {
		sandbox.reset();
	});

	it('returns null for missing messages', async () => {
		findOneByIdMessage.resolves(null);

		expect(await getAccessibleMessageForReadCounter('m1', 'viewer')).to.equal(null);
	});

	it('returns null for direct messages', async () => {
		findOneByIdMessage.resolves({ _id: 'm1', rid: 'r1', ts: new Date(), u: { _id: 'author' } });
		findOneByIdRoom.resolves({ _id: 'r1', t: 'd' });

		expect(await getAccessibleMessageForReadCounter('m1', 'viewer')).to.equal(null);
		expect(canReadRoom.called).to.equal(false);
	});

	it('returns null when the user cannot read the room', async () => {
		findOneByIdMessage.resolves({ _id: 'm1', rid: 'r1', ts: new Date(), u: { _id: 'author' } });
		findOneByIdRoom.resolves({ _id: 'r1', t: 'c' });
		canReadRoom.resolves(false);

		expect(await getAccessibleMessageForReadCounter('m1', 'viewer')).to.equal(null);
	});

	it('returns the message and room when access is allowed', async () => {
		const message = { _id: 'm1', rid: 'r1', ts: new Date(), u: { _id: 'author' } };
		const room = { _id: 'r1', t: 'c' };
		findOneByIdMessage.resolves(message);
		findOneByIdRoom.resolves(room);
		canReadRoom.resolves(true);

		expect(await getAccessibleMessageForReadCounter('m1', 'viewer')).to.deep.equal({ message, room });
	});
});
