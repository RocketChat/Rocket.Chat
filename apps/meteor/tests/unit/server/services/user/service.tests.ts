import { registerModel, BaseRaw } from '@rocket.chat/models';
import { expect } from 'chai';
import { afterEach, before, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const maxTokens = {
	getMaxLoginTokens: () => 2,
};

const { UserService } = proxyquire.noCallThru().load('../../../../../server/services/user/service', {
	'../../lib/getMaxLoginTokens': maxTokens,
});

class UsersModel extends BaseRaw<any> {
	async findAllResumeTokensByUserId(): Promise<Array<{ tokens: Array<{ when: Date }> }>> {
		return [];
	}

	async removeOlderResumeTokensByUserId(_uid: string, _when: Date) {
		// no op
	}
}

const usersModel = new UsersModel({ collection: () => ({}) } as unknown as any, 'user');

describe('User service', () => {
	before(() => {
		registerModel('IUsersModel', usersModel);
	});

	afterEach(() => sinon.restore());

	it('should do nothing if user has less login tokens than the limit', async () => {
		const service = new UserService();

		sinon.replace(usersModel, 'findAllResumeTokensByUserId', sinon.fake.returns(Promise.resolve([{ tokens: [{ when: new Date() }] }])));
		const updateFake = sinon.replace(usersModel, 'removeOlderResumeTokensByUserId', sinon.fake());

		const result = await service.ensureLoginTokensLimit('uid');

		expect(result).to.be.undefined;
		expect(updateFake.callCount).to.be.equal(0);
	});

	it('should remove the oldest tokens if over the limit', async () => {
		const service = new UserService();

		const firstOld = new Date('2023-01-03');

		// the query return the tokens in order so we should do the same here
		const tokens = [
			{ when: new Date('2023-01-01') },
			{ when: new Date('2023-01-02') },
			{ when: firstOld },
			{ when: new Date('2023-01-04') },
		];

		sinon.replace(usersModel, 'findAllResumeTokensByUserId', sinon.fake.returns(Promise.resolve([{ tokens }])));
		const updateFake = sinon.replace(usersModel, 'removeOlderResumeTokensByUserId', sinon.fake());

		const result = await service.ensureLoginTokensLimit('uid');

		expect(result).to.be.undefined;
		expect(updateFake.callCount).to.be.equal(1);
		expect(updateFake.lastCall.lastArg).to.be.equal(firstOld);
	});
});
