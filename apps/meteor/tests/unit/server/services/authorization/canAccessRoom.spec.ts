import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Subscriptions: {
		findOneBannedSubscription: sinon.stub(),
		countByRoomIdAndUserId: sinon.stub(),
	},
	Rooms: {
		findOneById: sinon.stub(),
	},
	TeamMember: {
		findOneByUserIdAndTeamId: sinon.stub(),
	},
	Team: {
		findOneById: sinon.stub(),
	},
	Users: {
		findOneById: sinon.stub(),
	},
};

const coreServicesMock = {
	Authorization: {
		hasPermission: sinon.stub(),
		canAccessRoom: sinon.stub(),
	},
	License: {
		hasModule: sinon.stub(),
	},
	Abac: {
		canAccessObject: sinon.stub(),
	},
	Settings: {
		get: sinon.stub(),
	},
};

const canAccessRoomLivechatMock = sinon.stub();

const { canAccessRoom, isPartialUser } = p.noCallThru().load('../../../../../server/services/authorization/canAccessRoom.ts', {
	'@rocket.chat/models': modelsMock,
	'@rocket.chat/core-services': coreServicesMock,
	'./canAccessRoomLivechat': { canAccessRoomLivechat: canAccessRoomLivechatMock },
});

describe('canAccessRoom', () => {
	beforeEach(() => {
		sinon.reset();

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

	describe('isPartialUser', () => {
		it('should return false for an undefined user', () => {
			expect(isPartialUser(undefined)).to.be.false;
		});

		it('should return false for an empty object', () => {
			expect(isPartialUser({})).to.be.false;
		});

		it('should return true for an object holding only a non-empty _id', () => {
			expect(isPartialUser({ _id: 'user-id' })).to.be.true;
		});

		it('should return false when _id is an empty string', () => {
			expect(isPartialUser({ _id: '' })).to.be.false;
		});

		it('should return false when _id is present but undefined', () => {
			expect(isPartialUser({ _id: undefined } as unknown as Pick<IUser, '_id'>)).to.be.false;
		});

		it('should return false when _id is present but null', () => {
			expect(isPartialUser({ _id: null } as unknown as Pick<IUser, '_id'>)).to.be.false;
		});

		it('should return false for a single-key object that is not _id', () => {
			expect(isPartialUser({ username: 'john.doe' } as unknown as Pick<IUser, '_id'>)).to.be.false;
		});

		it('should return false for a full user object', () => {
			expect(isPartialUser({ _id: 'user-id', username: 'john.doe' } as IUser)).to.be.false;
		});
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
			modelsMock.Users.findOneById.resolves(null);

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

		it('should not hydrate a user whose _id is empty, and treat it as anonymous instead of throwing', async () => {
			coreServicesMock.Settings.get.resolves(true);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: '' });

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
			expect(coreServicesMock.Settings.get.calledWith('Accounts_AllowAnonymousRead')).to.be.true;
			expect(result).to.be.true;
		});

		it('should deny access to a user whose _id is empty when anonymous read is off', async () => {
			coreServicesMock.Settings.get.resolves(false);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: '' });

			expect(modelsMock.Users.findOneById.notCalled).to.be.true;
			expect(result).to.be.false;
		});
	});
});
