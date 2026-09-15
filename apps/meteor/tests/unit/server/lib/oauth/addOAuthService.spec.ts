import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const stubs = {
	settingsRegistryAdd: sinon.stub(),
};

const { addOAuthService } = proxyquire.noCallThru().load('../../../../../server/lib/oauth/addOAuthService', {
	'../../../app/settings/server': {
		settingsRegistry: {
			add: stubs.settingsRegistryAdd,
		},
	},
});

const getShowButtonValue = (): unknown => {
	const call = stubs.settingsRegistryAdd
		.getCalls()
		.find((currentCall) => currentCall.args[0] === 'Accounts_OAuth_Custom-Github-show_button');

	return call?.args[1];
};

describe('addOAuthService', () => {
	beforeEach(() => {
		stubs.settingsRegistryAdd.reset();
		stubs.settingsRegistryAdd.resolves();
	});

	it('should preserve show_button as false when explicitly provided', async () => {
		await addOAuthService('github', { showButton: false });

		expect(getShowButtonValue()).to.equal(false);
	});

	it('should default show_button to true when not provided', async () => {
		await addOAuthService('github');

		expect(getShowButtonValue()).to.equal(true);
	});
});
