import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const modelsMock = {
	Subscriptions: {
		findOneBannedSubscription: sandbox.stub(),
		countByRoomIdAndUserId: sandbox.stub(),
	},
	Rooms: {
		findOneById: sandbox.stub(),
	},
	TeamMember: {
		findOneByUserIdAndTeamId: sandbox.stub(),
	},
	Team: {
		findOneById: sandbox.stub(),
	},
	Users: {
		findOneById: sandbox.stub(),
	},
};

const coreServicesMock = {
	Authorization: {
		hasPermission: sandbox.stub(),
		canAccessRoom: sandbox.stub(),
	},
	License: {
		hasModule: sandbox.stub(),
	},
	Abac: {
		canAccessObject: sandbox.stub(),
	},
	Settings: {
		get: sandbox.stub(),
	},
};

const canAccessRoomLivechatMock = sandbox.stub();

const { canAccessRoom } = p.noCallThru().load('../../../../../server/services/authorization/canAccessRoom.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': coreServicesMock,
	'./canAccessRoomLivechat': { canAccessRoomLivechat: canAccessRoomLivechatMock },
});

describe('canAccessRoom', () => {
	beforeEach(() => {
		sandbox.reset();

		// sane defaults: everything denies access unless a test says otherwise
		modelsMock.Subscriptions.findOneBannedSubscription.resolves(null);
		modelsMock.Subscriptions.countByRoomIdAndUserId.resolves(0);
		modelsMock.Rooms.findOneById.resolves(null);
		modelsMock.TeamMember.findOneByUserIdAndTeamId.resolves(null);
		modelsMock.Team.findOneById.resolves(null);
		modelsMock.Users.findOneById.resolves(null);
		coreServicesMock.Authorization.hasPermission.resolves(false);
		coreServicesMock.Authorization.canAccessRoom.resolves(false);
		coreServicesMock.License.hasModule.resolves(false);
		coreServicesMock.Abac.canAccessObject.resolves(false);
		coreServicesMock.Settings.get.resolves(false);
		canAccessRoomLivechatMock.resolves(false);
	});

	describe('user hydration', () => {
		it('should hydrate a partial user before running the validators', async () => {
			const fullUser = { _id: 'user-id', username: 'john.doe', roles: ['user'] };
			modelsMock.Users.findOneById.resolves(fullUser);
			coreServicesMock.Authorization.hasPermission.resolves(true);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id' });

			expect(result).to.be.true;
			expect(modelsMock.Users.findOneById.calledOnceWith('user-id')).to.be.true;
			expect(coreServicesMock.Authorization.hasPermission.calledWith(fullUser, 'view-c-room')).to.be.true;
		});

		it('should throw when the partial user cannot be found', async () => {
			await expect(canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id' })).to.be.rejectedWith('User not found');
		});

		it('should not hydrate a full user', async () => {
			await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id', username: 'john.doe' } as IUser);

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
		});

		it('should not hydrate an undefined user', async () => {
			await canAccessRoom({ _id: 'room-id', t: 'c' }, undefined);

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
		});

		it('should not hydrate a user whose _id is undefined, and treat it as anonymous instead of throwing when anonymous read is on', async () => {
			coreServicesMock.Settings.get.resolves(true);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: undefined });

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
			expect(coreServicesMock.Settings.get.calledWith('Accounts_AllowAnonymousRead')).to.be.true;
			expect(result).to.be.true;
		});

		it('should deny access to a user whose _id is undefined when anonymous read is off', async () => {
			coreServicesMock.Settings.get.resolves(false);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: undefined });

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
			expect(result).to.be.false;
		});
	});
});
