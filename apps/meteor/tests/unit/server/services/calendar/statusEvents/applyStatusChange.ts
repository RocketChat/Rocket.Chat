import { api } from '@rocket.chat/core-services';
import { UserStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const UsersMock = {
	findOneById: sinon.stub(),
	updateOne: sinon.stub(),
	updateStatusAndStatusDefault: sinon.stub().resolves(),
};

const { applyStatusChange } = proxyquire.noCallThru().load('../../../../../../server/services/calendar/statusEvents/applyStatusChange', {
	'@rocket.chat/core-services': { api },
	'@rocket.chat/models': {
		Users: UsersMock,
	},
});

describe('Calendar.StatusEvents', () => {
	let sandbox: sinon.SinonSandbox;
	const fakeEventId = 'eventId123';
	const fakeUserId = 'userId456';
	const fakeStartTime = new Date('2025-01-01T10:00:00Z');
	const fakeEndTime = new Date('2025-01-01T11:00:00Z');

	beforeEach(() => {
		sandbox = sinon.createSandbox();
		setupUsersMocks();
		setupOtherMocks();
	});

	function setupUsersMocks() {
		const freshMocks = {
			findOneById: sinon.stub().resolves({
				_id: fakeUserId,
				status: UserStatus.ONLINE,
				roles: ['user'],
				username: 'testuser',
				name: 'Test User',
			} as any),
			updateOne: sinon.stub().resolves({ modifiedCount: 1 } as any),
			updateStatusAndStatusDefault: sinon.stub().resolves(),
		};

		Object.assign(UsersMock, freshMocks);
	}

	function setupOtherMocks() {
		sandbox.stub(api, 'broadcast').resolves();
	}

	afterEach(() => {
		sandbox.restore();
	});

	describe('#applyStatusChange', () => {
		it('should do nothing if user is not found', async () => {
			UsersMock.findOneById.resolves(null);

			await applyStatusChange({
				eventId: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				status: undefined,
				shouldScheduleRemoval: false,
			});

			expect(UsersMock.updateStatusAndStatusDefault.callCount).to.equal(0);
			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(0);
		});

		it('should do nothing if user is offline', async () => {
			UsersMock.findOneById.resolves({
				_id: fakeUserId,
				status: UserStatus.OFFLINE,
			});

			await applyStatusChange({
				eventId: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				status: undefined,
				shouldScheduleRemoval: false,
			});

			expect(UsersMock.updateStatusAndStatusDefault.callCount).to.equal(0);
			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(0);
		});

		it('should use UserStatus.BUSY as default if no status provided', async () => {
			UsersMock.updateStatusAndStatusDefault.resetHistory();

			await applyStatusChange({
				eventId: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				status: undefined,
				shouldScheduleRemoval: false,
			});

			expect(UsersMock.updateStatusAndStatusDefault.callCount).to.equal(1);
			expect(UsersMock.updateStatusAndStatusDefault.firstCall.args[1]).to.equal(UserStatus.BUSY);
		});

		it('should update user status and broadcast presence update', async () => {
			const previousStatus = UserStatus.ONLINE;
			const newStatus = UserStatus.AWAY;

			UsersMock.updateStatusAndStatusDefault.resetHistory();
			(api.broadcast as sinon.SinonStub).resetHistory();

			UsersMock.findOneById.resolves({
				_id: fakeUserId,
				status: previousStatus,
				roles: ['user'],
				username: 'testuser',
				name: 'Test User',
			});

			await applyStatusChange({
				eventId: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				status: newStatus,
				shouldScheduleRemoval: false,
			});

			expect(UsersMock.updateStatusAndStatusDefault.callCount).to.equal(1);
			expect(UsersMock.updateStatusAndStatusDefault.firstCall.args).to.deep.equal([fakeUserId, newStatus, newStatus]);

			expect((api.broadcast as sinon.SinonStub).callCount).to.equal(1);
			expect((api.broadcast as sinon.SinonStub).firstCall.args[0]).to.equal('presence.status');
		});

		it('should schedule status revert when shouldScheduleRemoval=true', async () => {
			await applyStatusChange({
				eventId: fakeEventId,
				uid: fakeUserId,
				startTime: fakeStartTime,
				endTime: fakeEndTime,
				status: UserStatus.BUSY,
			});
		});
	});
});
