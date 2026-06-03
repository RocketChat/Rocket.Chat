import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

const hasPermissionStub = sinon.stub();

const AccountsMock = {
	_generateStampedLoginToken: sinon.stub(),
	_insertLoginToken: sinon.stub(),
};

const UserMock = {
	ensureLoginTokensLimit: sinon.stub(),
};

const AuthorizationMock = {
	hasPermission: hasPermissionStub,
};

class MeteorErrorMock extends Error {
	error: string;

	constructor(error: string, reason: string) {
		super(reason);
		this.error = error;
	}
}

process.env.CREATE_TOKENS_FOR_USERS_SECRET = 'V@9#mK2$pL8!nQ5^rT1&wX6*jY3%uZ7';

const { generateAccessToken } = p.noCallThru().load('../../../../../../app/lib/server/methods/createToken.ts', {
	'@rocket.chat/core-services': { Authorization: AuthorizationMock, MeteorError: MeteorErrorMock, User: UserMock },
	'meteor/accounts-base': { Accounts: AccountsMock },
});

describe('generateAccessToken', () => {
	beforeEach(() => {
		hasPermissionStub.reset();
		AccountsMock._generateStampedLoginToken.reset();
		AccountsMock._insertLoginToken.reset();
		UserMock.ensureLoginTokensLimit.reset();
	});

	it('should throw if secret does not match', async () => {
		await expect(generateAccessToken('targetId', 'wrong-secret', { _id: 'callerId' })).to.be.rejectedWith('Not authorized');
	});

	it('should throw if caller targets another user and lacks user-generate-access-token permission', async () => {
		hasPermissionStub.resolves(false);

		await expect(generateAccessToken('targetId', 'V@9#mK2$pL8!nQ5^rT1&wX6*jY3%uZ7', { _id: 'callerId' })).to.be.rejectedWith(
			'Not authorized',
		);
		sinon.assert.calledOnceWithExactly(hasPermissionStub, { _id: 'callerId' }, 'user-generate-access-token');
	});

	it('should succeed if caller targets another user and has user-generate-access-token permission', async () => {
		hasPermissionStub.resolves(true);
		AccountsMock._generateStampedLoginToken.returns({ token: 'abc123' });
		UserMock.ensureLoginTokensLimit.resolves();

		const result = await generateAccessToken('targetId', 'V@9#mK2$pL8!nQ5^rT1&wX6*jY3%uZ7', { _id: 'callerId' });

		expect(result).to.deep.equal({ userId: 'targetId', authToken: 'abc123' });
		sinon.assert.calledOnceWithExactly(hasPermissionStub, { _id: 'callerId' }, 'user-generate-access-token');
	});

	it('should succeed without permission check when caller generates token for themselves', async () => {
		AccountsMock._generateStampedLoginToken.returns({ token: 'abc123' });
		UserMock.ensureLoginTokensLimit.resolves();

		const result = await generateAccessToken('userId', 'V@9#mK2$pL8!nQ5^rT1&wX6*jY3%uZ7', { _id: 'userId' });

		expect(result).to.deep.equal({ userId: 'userId', authToken: 'abc123' });
		sinon.assert.notCalled(hasPermissionStub);
	});
});
