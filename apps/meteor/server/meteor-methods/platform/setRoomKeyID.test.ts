import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const canAccessRoomIdAsync = sinon.stub();
const updateGroupKey = sinon.stub();
const SystemLogger = { error: sinon.stub() };
const models = {
	Rooms: {
		setE2eKeyId: sinon.stub(),
		unsetE2eKeyId: sinon.stub(),
	},
	Subscriptions: {
		findOneByRoomIdAndUserId: sinon.stub(),
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
	'../../lib/logger/system': { SystemLogger },
	'../../lib/notifyListener': { notifyOnRoomChanged: sinon.stub() },
	'./updateGroupKey': { updateGroupKey },
});

describe('setRoomKeyIDMethod', () => {
	beforeEach(() => {
		canAccessRoomIdAsync.reset();
		updateGroupKey.reset();
		SystemLogger.error.reset();
		models.Rooms.setE2eKeyId.reset();
		models.Rooms.unsetE2eKeyId.reset();
		models.Subscriptions.findOneByRoomIdAndUserId.reset();
		canAccessRoomIdAsync.resolves(true);
		models.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sid' });
	});

	it('should save the room key of the caller in the same request that sets the room key id', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(models.Rooms.setE2eKeyId.calledOnceWithExactly('rid', 'kid')).to.be.true;
		expect(updateGroupKey.calledOnceWithExactly('rid', 'uid', 'kid-encrypted-key', 'uid')).to.be.true;
	});

	it('should only set the room key id when the caller sends no room key', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });

		await setRoomKeyIDMethod('uid', 'rid', 'kid');

		expect(models.Rooms.setE2eKeyId.calledOnceWithExactly('rid', 'kid')).to.be.true;
		expect(updateGroupKey.called).to.be.false;
	});

	it('should not set the room key id when the caller sends a room key but has no subscription to save it on', async () => {
		models.Subscriptions.findOneByRoomIdAndUserId.resolves(null);

		let error: Error | undefined;
		try {
			await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');
		} catch (e) {
			error = e as Error;
		}

		expect(error?.message).to.equal('error-invalid-room');
		expect(models.Subscriptions.findOneByRoomIdAndUserId.calledOnceWithExactly('rid', 'uid', { projection: { _id: 1 } })).to.be.true;
		expect(models.Rooms.setE2eKeyId.called).to.be.false;
		expect(updateGroupKey.called).to.be.false;
	});

	it('should remove the room key id again when the room key of the caller cannot be saved', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });
		updateGroupKey.rejects(new Error('write failed'));

		let error: Error | undefined;
		try {
			await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');
		} catch (e) {
			error = e as Error;
		}

		expect(error?.message).to.equal('write failed');
		expect(models.Rooms.unsetE2eKeyId.calledOnceWithExactly('rid', 'kid')).to.be.true;
	});

	it('should throw the error of the room key write when removing the room key id also fails', async () => {
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });
		updateGroupKey.rejects(new Error('write failed'));
		models.Rooms.unsetE2eKeyId.rejects(new Error('unset failed'));

		let error: Error | undefined;
		try {
			await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');
		} catch (e) {
			error = e as Error;
		}

		expect(error?.message).to.equal('write failed');
		expect(SystemLogger.error.calledOnce).to.be.true;
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
