import { expect } from 'chai';
import { afterEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Users: {
		findOneById: sinon.stub(),
	},
};

const MeteorErrorMock = class extends Error {
	constructor(message: string) {
		super(message);
	}
};

const { validateRequiredRolesForRoom } = p.noCallThru().load(
	'../../../../../app/authorization/server/validateRequiredRolesForRoom',
	{
		'@rocket.chat/models': modelsMock,
		'meteor/meteor': { Meteor: { Error: MeteorErrorMock } },
	},
);

describe('validateRequiredRolesForRoom', () => {
	afterEach(() => {
		sinon.resetHistory();
	});

	it('should pass if room has no requiredRoles', async () => {
		await expect(validateRequiredRolesForRoom({} as any, 'user1')).to.be.fulfilled;
		expect(modelsMock.Users.findOneById.called).to.be.false;
	});

	it('should throw if user is not found', async () => {
		modelsMock.Users.findOneById.resolves(undefined);

		await expect(validateRequiredRolesForRoom({ requiredRoles: ['admin'] } as any, 'user1')).to.be.rejectedWith('error-invalid-user');
	});

	it('should throw if user lacks required role', async () => {
		modelsMock.Users.findOneById.resolves({ roles: ['user'] });

		await expect(validateRequiredRolesForRoom({ requiredRoles: ['admin'] } as any, 'user1')).to.be.rejectedWith(
			'error-required-role-missing',
		);
	});

	it('should pass if user has required role', async () => {
		modelsMock.Users.findOneById.resolves({ roles: ['admin'] });

		await expect(validateRequiredRolesForRoom({ requiredRoles: ['admin'] } as any, 'user1')).to.be.fulfilled;
	});
});
