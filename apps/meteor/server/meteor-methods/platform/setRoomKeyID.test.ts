import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const canAccessRoomIdAsync = sinon.stub();
const updateGroupKey = sinon.stub();
const models = {
	Rooms: {
		setE2eKeyId: sinon.stub(),
	},
};

const { setRoomKeyIDMethod } = proxyquire.noCallThru().load('./setRoomKeyID.ts', {
	'@rocket.chat/core-services': {
		ClientSafeError: class extends Error {
			constructor(public error: string) {
				super(error);
			}
		},
	},
	'@rocket.chat/models': models,
	'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync },
	'../../lib/notifyListener': { notifyOnRoomChanged: sinon.stub() },
	'./updateGroupKey': { updateGroupKey },
});

describe('setRoomKeyIDMethod', () => {
	beforeEach(() => {
		canAccessRoomIdAsync.reset();
		updateGroupKey.reset();
		models.Rooms.setE2eKeyId.reset();
		canAccessRoomIdAsync.resolves(true);
	});

	it('should save the room key of the caller in the same request that sets the room key id', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(updateGroupKey.calledOnceWithExactly('rid', 'uid', 'kid-encrypted-key', 'uid')).to.be.true;
	});

	it('should only set the room key id when the caller sends no room key', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });

		await setRoomKeyIDMethod('uid', 'rid', 'kid');

		expect(models.Rooms.setE2eKeyId.calledOnce).to.be.true;
		expect(updateGroupKey.called).to.be.false;
	});

	it('should not save the room key of the caller when the room already has a key id', async () => {
		models.Rooms.setE2eKeyId.resolves(null);

		let error: Error | undefined;
		try {
			await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');
		} catch (e) {
			error = e as Error;
		}

		expect(error?.message).to.equal('error-room-e2e-key-already-exists');
		expect(updateGroupKey.called).to.be.false;
	});
});
