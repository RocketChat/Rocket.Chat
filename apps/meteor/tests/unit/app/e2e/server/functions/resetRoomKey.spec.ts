import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { generateMultipleSubs } from '../../../../../mocks/data/subscriptions';

function addSecondsToDate(seconds: number, date = new Date()) {
	return new Date(date.getTime() + seconds * 1000);
}

const models = {
	Users: {
		findOneById: sinon.stub(),
	},
	Rooms: {
		findOneById: sinon.stub(),
		resetRoomKeyAndSetE2EEQueueByRoomId: sinon.stub(),
	},
	Subscriptions: {
		find: sinon.stub(),
		col: {
			bulkWrite: sinon.stub(),
		},
		setE2EKeyByUserIdAndRoomId: sinon.stub(),
	},
};

const { resetRoomKey, pushToLimit, replicateMongoSlice } = proxyquire
	.noCallThru()
	.load('../../../../../../app/e2e/server/functions/resetRoomKey', {
		'@rocket.chat/models': models,
		'../../../lib/server/lib/notifyListener': {
			notifyOnRoomChanged: sinon.stub(),
			notifyOnSubscriptionChanged: sinon.stub(),
		},
	});

describe('pushToLimit', () => {
	it('should push up to a limit', () => {
		const arr: any[] = [];
		pushToLimit(arr, { foo: 'bar' }, 2);

		expect(arr).to.have.lengthOf(1);
		expect(arr[0]).to.deep.equal({ foo: 'bar' });

		pushToLimit(arr, { foo: 'bar' }, 2);
		expect(arr).to.have.lengthOf(2);
		expect(arr[0]).to.deep.equal({ foo: 'bar' });
		expect(arr[1]).to.deep.equal({ foo: 'bar' });

		pushToLimit(arr, { foo: 'bzz' }, 2);
		expect(arr).to.have.lengthOf(2);
		expect(arr[0]).to.deep.equal({ foo: 'bar' });
		expect(arr[1]).to.deep.equal({ foo: 'bar' });
		expect(arr.filter((e: any) => e.foo === 'bzz')).to.have.lengthOf(0);
	});
});

describe('replicateMongoSlice', () => {
	it('should do nothing if sub has no E2EKey', () => {
		expect(replicateMongoSlice('1', { oldRoomKeys: [] })).to.be.undefined;
	});
	it('should return an array with the new E2EKey as an old key when there is no oldkeys', () => {
		expect(replicateMongoSlice('1', { E2EKey: '1' })[0].E2EKey).to.equal('1');
	});
	it('should unshift a new key if sub has E2EKey and oldRoomKeys', () => {
		expect(replicateMongoSlice('1', { oldRoomKeys: [{ E2EKey: '1', ts: new Date() }], E2EKey: '2' })[0].E2EKey).to.equal('2');
	});
	it('should unshift a new key, and eliminate the 10th key if array has 10 items', () => {
		const result = replicateMongoSlice('1', {
			oldRoomKeys: [
				{ E2EKey: '1', ts: addSecondsToDate(0) },
				{ E2EKey: '2', ts: addSecondsToDate(-10) },
				{ E2EKey: '3', ts: addSecondsToDate(-20) },
				{ E2EKey: '4', ts: addSecondsToDate(-30) },
				{ E2EKey: '5', ts: addSecondsToDate(-40) },
				{ E2EKey: '6', ts: addSecondsToDate(-50) },
				{ E2EKey: '7', ts: addSecondsToDate(-60) },
				{ E2EKey: '8', ts: addSecondsToDate(-70) },
				{ E2EKey: '9', ts: addSecondsToDate(-80) },
				{ E2EKey: '10', ts: addSecondsToDate(-90) },
			],
			E2EKey: '11',
		});

		expect(result[0].E2EKey).to.equal('11');
		expect(result[9].E2EKey).to.equal('9');
		expect(result).to.have.lengthOf(10);
	});
});

describe('resetRoomKey', () => {
	beforeEach(() => {
		models.Users.findOneById.reset();
		models.Rooms.findOneById.reset();
		models.Rooms.resetRoomKeyAndSetE2EEQueueByRoomId.reset();
		models.Subscriptions.setE2EKeyByUserIdAndRoomId.reset();
		models.Subscriptions.col.bulkWrite.reset();
	});

	it('should fail if userId does not exist', async () => {
		models.Users.findOneById.resolves(null);

		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-user-not-found');
	});

	it('should fail if the user has no e2e keys', async () => {
		models.Users.findOneById.resolves({});

		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-user-has-no-keys');

		models.Users.findOneById.resolves({ e2e: { private_key: 'a' } });

		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-user-has-no-keys');

		models.Users.findOneById.resolves({ e2e: { public_key: 'b' } });

		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-user-has-no-keys');
	});

	it('should fail if roomId does not exist', async () => {
		models.Users.findOneById.resolves({ e2e: { private_key: 'a', public_key: 'b' } });

		models.Rooms.findOneById.resolves(null);
		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-room-not-found');
	});

	it('should fail if room does not have a keyId', async () => {
		models.Users.findOneById.resolves({ e2e: { private_key: 'a', public_key: 'b' } });

		models.Rooms.findOneById.resolves({ e2eKeyId: null });

		await expect(resetRoomKey('1', '2', '3', '4')).to.be.rejectedWith('error-room-not-encrypted');
	});

	it('should try to process subs', async () => {
		const subs = generateMultipleSubs(10);
		function* generateSubs() {
			for (const sub of subs) {
				yield { ...sub };
			}
		}

		models.Users.findOneById.resolves({ e2e: { private_key: 'a', public_key: 'b' } });
		models.Rooms.findOneById.resolves({ e2eKeyId: '5' });
		models.Subscriptions.find.returns(generateSubs());

		models.Rooms.resetRoomKeyAndSetE2EEQueueByRoomId.resolves({ value: { e2eKeyId: '5' } });
		models.Subscriptions.setE2EKeyByUserIdAndRoomId.resolves({ value: { e2eKeyId: '5' } });

		await resetRoomKey('1', '2', '3', '4');

		expect(models.Subscriptions.col.bulkWrite.callCount).to.equal(1);
		const updateOps = models.Subscriptions.col.bulkWrite.getCall(0).args[0];
		expect(updateOps).to.have.lengthOf(10);
		expect(updateOps.every((op: any) => op.updateOne)).to.be.true;
		updateOps.forEach((op: any) => {
			const sub = subs.find((s: any) => s._id === op.updateOne.filter._id);

			expect(op.updateOne.update.$unset).to.be.deep.equal({ E2EKey: 1, E2ESuggestedKey: 1, suggestedOldRoomKeys: 1 });

			if (sub?.E2EKey && sub?.oldRoomKeys?.length < 10) {
				expect(op.updateOne.update.$set.oldRoomKeys).to.have.length(sub.oldRoomKeys.length + 1);
				expect(
					op.updateOne.update.$set.oldRoomKeys.every((key: any) =>
						[...sub.oldRoomKeys.map((k: any) => k.E2EKey), sub.E2EKey].includes(key.E2EKey),
					),
				).to.be.true;
			}

			if (!sub?.E2EKey && !sub?.oldRoomKeys) {
				expect(op.updateOne.update).to.not.to.have.property('$set');
			}

			if (sub?.oldRoomKeys?.length === 10 && sub?.E2EKey) {
				expect(op.updateOne.update.$set.oldRoomKeys).to.have.length(10);
				expect(op.updateOne.update.$set.oldRoomKeys[0].E2EKey).to.equal(sub.E2EKey);
			}
		});

		expect(models.Rooms.resetRoomKeyAndSetE2EEQueueByRoomId.getCall(0).args[0]).to.equal('1');
		expect(models.Subscriptions.setE2EKeyByUserIdAndRoomId.getCall(0).args).to.deep.equal(['2', '1', '3']);
	});

	it('should process more than 100 subs', async () => {
		const subs = generateMultipleSubs(150);
		function* generateSubs() {
			for (const sub of subs) {
				yield { ...sub };
			}
		}

		models.Users.findOneById.resolves({ e2e: { private_key: 'a', public_key: 'b' } });
		models.Rooms.findOneById.resolves({ e2eKeyId: '5' });
		models.Subscriptions.find.returns(generateSubs());

		models.Rooms.resetRoomKeyAndSetE2EEQueueByRoomId.resolves({ value: { e2eKeyId: '5' } });
		models.Subscriptions.setE2EKeyByUserIdAndRoomId.resolves({ value: { e2eKeyId: '5' } });

		await resetRoomKey('1', '2', '3', '4');

		expect(models.Subscriptions.col.bulkWrite.callCount).to.equal(2);
		expect(models.Subscriptions.col.bulkWrite.getCall(0).args[0]).to.have.lengthOf(100);
		expect(models.Subscriptions.col.bulkWrite.getCall(1).args[0]).to.have.lengthOf(50);
	});
});
