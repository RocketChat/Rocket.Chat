import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('SAML startup', () => {
	it('reloads the service providers when the saml-enterprise module becomes active after the first load', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const loadSamlServiceProviders = sinon.stub().resolves();
			const licenseCallbacks: Array<() => unknown> = [];

			proxyquire.noCallThru().load('../../../../../server/lib/saml/startup', {
				'@rocket.chat/logger': { Logger: class {} },
				'@rocket.chat/license': {
					License: {
						onLicense: (module: string, cb: () => unknown) => {
							if (module === 'saml-enterprise') {
								licenseCallbacks.push(cb);
							}
							return Promise.resolve();
						},
					},
				},
				'meteor/meteor': { Meteor: { startup: sinon.stub() } },
				'./lib/Utils': { SAMLUtils: { setLoggerInstance: sinon.stub() } },
				'./lib/settings': { loadSamlServiceProviders, addSettings: sinon.stub(), updateGlobalSettings: sinon.stub() },
				'../../settings': {
					settings: {
						// The settings cache is ready: the watcher runs right away for the stored SAML settings.
						watchByRegex: (_regex: RegExp, cb: () => void) => cb(),
					},
				},
			});

			await clock.tickAsync(500);
			expect(loadSamlServiceProviders.callCount).to.equal(1);

			// The license finishes applying only after that first load.
			await Promise.all(licenseCallbacks.map((cb) => cb()));
			await clock.tickAsync(500);

			expect(loadSamlServiceProviders.callCount).to.equal(2);
		} finally {
			clock.restore();
		}
	});
});
