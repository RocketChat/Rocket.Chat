import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const stubs = {
	addOAuthService: sinon.stub(),
};

const { initCustomOAuthServices } = proxyquire.noCallThru().load('../../../../../server/lib/oauth/initCustomOAuthServices', {
	'./addOAuthService': {
		addOAuthService: stubs.addOAuthService,
	},
});

const getServiceCall = (serviceName: string) => stubs.addOAuthService.getCalls().find((call) => call.args[0] === serviceName);

describe('initCustomOAuthServices', () => {
	const serviceName = 'CodexShowButtonService';
	const serviceKey = `Accounts_OAuth_Custom_${serviceName}`;

	beforeEach(() => {
		stubs.addOAuthService.reset();
		stubs.addOAuthService.resolves();
	});

	afterEach(() => {
		delete process.env[serviceKey];
		delete process.env[`${serviceKey}_show_button`];
	});

	it('should pass undefined showButton when _show_button env is omitted', async () => {
		process.env[serviceKey] = 'true';

		await initCustomOAuthServices();

		const call = getServiceCall(serviceName);
		expect(call).to.not.equal(undefined);
		expect(call?.args[1].showButton).to.equal(undefined);
	});

	it('should pass false showButton when _show_button env is false', async () => {
		process.env[serviceKey] = 'true';
		process.env[`${serviceKey}_show_button`] = 'false';

		await initCustomOAuthServices();

		const call = getServiceCall(serviceName);
		expect(call).to.not.equal(undefined);
		expect(call?.args[1].showButton).to.equal(false);
	});

	it('should pass true showButton when _show_button env is true', async () => {
		process.env[serviceKey] = 'true';
		process.env[`${serviceKey}_show_button`] = 'true';

		await initCustomOAuthServices();

		const call = getServiceCall(serviceName);
		expect(call).to.not.equal(undefined);
		expect(call?.args[1].showButton).to.equal(true);
	});
});
