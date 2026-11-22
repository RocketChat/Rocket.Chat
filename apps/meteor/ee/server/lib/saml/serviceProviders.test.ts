import { EventEmitter } from 'node:events';
import { describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const setup = ({ samlModuleActiveAtStartup = false } = {}) => {
	const store = new Map<string, unknown>([
		['SAML_Custom_Default', true],
		['SAML_Custom_Default_provider', 'adfs'],
		['SAML_Custom_Default_entry_point', 'https://idp.example.com/sso'],
		['SAML_Custom_Default_signature_validation_type', 'None'],
		['SAML_Custom_Default_custom_authn_context', 'urn:test:custom'],
		['SAML_Custom_Default_authn_context_comparison', 'minimum'],
	]);
	const watchers = new Set<{ regex: RegExp; cb: () => void }>();
	const settings = {
		get: (key: string) => store.get(key),
		getByRegexp: (regex: RegExp) => [...store.entries()].filter(([key]) => regex.test(key)),
		// The settings cache is ready: a new watcher runs right away for the stored settings it matches.
		watchByRegex: (regex: RegExp, cb: () => void) => {
			const watcher = { regex, cb };
			watchers.add(watcher);
			if ([...store.keys()].some((key) => regex.test(key))) {
				cb();
			}
			return () => watchers.delete(watcher);
		},
	};
	const changeSetting = (key: string, value: unknown) => {
		store.set(key, value);
		watchers.forEach(({ regex, cb }) => regex.test(key) && cb());
	};

	let samlModuleActive = samlModuleActiveAtStartup;
	const toggles: Array<{ up?: () => unknown; down?: () => unknown }> = [];
	const License = {
		hasModule: (module: string) => module === 'saml-enterprise' && samlModuleActive,
		// Like the real one: `up` runs right away when the module is already active.
		onToggledFeature: (module: string, toggle: { up?: () => unknown; down?: () => unknown }) => {
			if (module === 'saml-enterprise') {
				toggles.push(toggle);
				if (samlModuleActive) {
					void toggle.up?.();
				}
			}
			return () => undefined;
		},
	};
	const toggleSamlModule = async (active: boolean) => {
		samlModuleActive = active;
		await Promise.all(toggles.map((toggle) => (active ? toggle.up?.() : toggle.down?.())));
	};

	const SAMLUtils = {
		events: new EventEmitter(),
		setServiceProvidersList: sinon.stub(),
		updateGlobalSettings: sinon.stub(),
		setLoggerInstance: sinon.stub(),
		log: sinon.stub(),
		error: sinon.stub(),
		normalizeCert: (cert: string) => cert,
	};

	const LoginServiceConfiguration = {
		createOrUpdateService: sinon.stub().resolves(),
		removeByService: sinon.stub().resolves({ _id: 'saml-service-id' }),
	};
	mockModel('LoginServiceConfiguration', LoginServiceConfiguration);
	const notifyOnLoginServiceConfigurationChanged = sinon.stub();

	const samlSettings = proxyquire.noCallThru().load('./lib/settings', {
		'@rocket.chat/license': { License },
		'./Utils': { SAMLUtils },
		'../../../../../server/lib/utils/getURL': { getWorkspaceURL: () => 'http://localhost:3000/' },
		'../../../../../server/lib/logger/system': { SystemLogger: { warn: sinon.stub() } },
		'../../../../../server/lib/notifyListener': {
			notifyOnLoginServiceConfigurationChanged,
			notifyOnLoginServiceConfigurationChangedByService: sinon.stub(),
		},
		'../../../../../server/settings': { settings, settingsRegistry: {} },
	});

	const samlStartup = proxyquire.noCallThru().load('./serviceProviders', {
		'@rocket.chat/license': { License },
		'./lib/Utils': { SAMLUtils },
		'./lib/settings': samlSettings,
		'../../../../server/settings': { settings },
	});
	samlStartup.watchSamlServiceProviders();

	// Same listener ee/server/configuration/saml.ts registers once the module is licensed.
	License.onToggledFeature('saml-enterprise', {
		up: () => {
			SAMLUtils.events.on('loadConfigs', (service: string, configs: Record<string, unknown>) => {
				Object.assign(configs, {
					customAuthnContext: settings.get(`${service}_custom_authn_context`),
					authnContextComparison: settings.get(`${service}_authn_context_comparison`),
				});
			});
		},
	});

	return { samlStartup, SAMLUtils, LoginServiceConfiguration, notifyOnLoginServiceConfigurationChanged, changeSetting, toggleSamlModule };
};

describe('SAML startup', () => {
	it('registers the enabled provider with its enterprise settings when the module is already licensed at startup', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { samlStartup, SAMLUtils, LoginServiceConfiguration } = setup({ samlModuleActiveAtStartup: true });

			await clock.tickAsync(500);

			const providers = SAMLUtils.setServiceProvidersList.lastCall.args[0];
			expect(providers).to.have.lengthOf(1);
			expect(providers[0]).to.include({ provider: 'adfs', customAuthnContext: 'urn:test:custom', authnContextComparison: 'minimum' });
			expect(LoginServiceConfiguration.createOrUpdateService.calledWith('saml')).to.equal(true);

			await samlStartup.unloadSamlServiceProvidersWithoutLicense();
			expect(LoginServiceConfiguration.removeByService.called).to.equal(false);
		} finally {
			clock.restore();
		}
	});

	it('registers the enabled provider with its enterprise settings once the license loads after startup', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { SAMLUtils, toggleSamlModule } = setup();

			await clock.tickAsync(500);
			expect(SAMLUtils.setServiceProvidersList.lastCall?.args[0] ?? []).to.deep.equal([]);

			await toggleSamlModule(true);
			await clock.tickAsync(500);

			const providers = SAMLUtils.setServiceProvidersList.lastCall.args[0];
			expect(providers).to.have.lengthOf(1);
			expect(providers[0]).to.include({
				provider: 'adfs',
				entryPoint: 'https://idp.example.com/sso',
				customAuthnContext: 'urn:test:custom',
				authnContextComparison: 'minimum',
			});
		} finally {
			clock.restore();
		}
	});

	it('clears the providers, removes the SAML login service and stops reacting to SAML settings when the license loses the module', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { SAMLUtils, LoginServiceConfiguration, notifyOnLoginServiceConfigurationChanged, changeSetting, toggleSamlModule } = setup();

			await toggleSamlModule(true);
			await clock.tickAsync(500);
			expect(SAMLUtils.setServiceProvidersList.lastCall.args[0]).to.have.lengthOf(1);

			await toggleSamlModule(false);
			await clock.tickAsync(0);
			expect(SAMLUtils.setServiceProvidersList.lastCall.args[0]).to.deep.equal([]);
			expect(LoginServiceConfiguration.removeByService.calledWith('saml')).to.equal(true);
			expect(notifyOnLoginServiceConfigurationChanged.calledWith({ _id: 'saml-service-id' }, 'removed')).to.equal(true);

			SAMLUtils.setServiceProvidersList.resetHistory();
			changeSetting('SAML_Custom_Default_entry_point', 'https://other-idp.example.com/sso');
			await clock.tickAsync(500);

			expect(SAMLUtils.setServiceProvidersList.called).to.equal(false);
		} finally {
			clock.restore();
		}
	});

	it('removes a SAML login service kept from before when the server starts without the module', async () => {
		const { samlStartup, SAMLUtils, LoginServiceConfiguration, notifyOnLoginServiceConfigurationChanged } = setup();

		await samlStartup.unloadSamlServiceProvidersWithoutLicense();

		expect(LoginServiceConfiguration.removeByService.calledWith('saml')).to.equal(true);
		expect(notifyOnLoginServiceConfigurationChanged.calledWith({ _id: 'saml-service-id' }, 'removed')).to.equal(true);
		expect(LoginServiceConfiguration.createOrUpdateService.called).to.equal(false);
		expect(SAMLUtils.setServiceProvidersList.lastCall.args[0]).to.deep.equal([]);
	});

	it('keeps the SAML login service when the server starts with the module', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { samlStartup, LoginServiceConfiguration, toggleSamlModule } = setup();

			await toggleSamlModule(true);
			await clock.tickAsync(500);
			LoginServiceConfiguration.removeByService.resetHistory();

			await samlStartup.unloadSamlServiceProvidersWithoutLicense();

			expect(LoginServiceConfiguration.removeByService.called).to.equal(false);
		} finally {
			clock.restore();
		}
	});

	it('logs a failure to remove the SAML login service when the license loses the module', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { SAMLUtils, LoginServiceConfiguration, toggleSamlModule } = setup();

			await toggleSamlModule(true);
			await clock.tickAsync(500);

			const failure = new Error('database unavailable');
			LoginServiceConfiguration.removeByService.rejects(failure);
			await toggleSamlModule(false);
			await clock.tickAsync(0);

			expect(SAMLUtils.error.calledWithMatch({ err: failure })).to.equal(true);
		} finally {
			clock.restore();
		}
	});

	it('waits for the removal from a license loss before storing the login service again', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { SAMLUtils, LoginServiceConfiguration, toggleSamlModule } = setup();

			await toggleSamlModule(true);
			await clock.tickAsync(500);

			let finishRemoval: () => void = () => undefined;
			LoginServiceConfiguration.removeByService.returns(
				new Promise((resolve) => {
					finishRemoval = () => resolve(null);
				}),
			);
			LoginServiceConfiguration.createOrUpdateService.resetHistory();

			await toggleSamlModule(false);
			await toggleSamlModule(true);
			await clock.tickAsync(500);

			expect(LoginServiceConfiguration.createOrUpdateService.called).to.equal(false);

			finishRemoval();
			await clock.tickAsync(0);

			expect(LoginServiceConfiguration.createOrUpdateService.calledOnce).to.equal(true);
			expect(SAMLUtils.setServiceProvidersList.lastCall.args[0]).to.have.lengthOf(1);
		} finally {
			clock.restore();
		}
	});

	it('does not publish the providers of a build that finishes after the license lost the module', async () => {
		const clock = sinon.useFakeTimers();
		try {
			const { SAMLUtils, LoginServiceConfiguration, toggleSamlModule } = setup();
			let finishStoringService: () => void = () => undefined;
			LoginServiceConfiguration.createOrUpdateService.returns(
				new Promise<void>((resolve) => {
					finishStoringService = resolve;
				}),
			);

			await toggleSamlModule(true);
			// The debounced build starts and waits on the login service write.
			await clock.tickAsync(500);

			await toggleSamlModule(false);
			await clock.tickAsync(0);
			LoginServiceConfiguration.removeByService.resetHistory();

			finishStoringService();
			await clock.tickAsync(0);

			expect(SAMLUtils.setServiceProvidersList.lastCall.args[0]).to.deep.equal([]);
			expect(SAMLUtils.setServiceProvidersList.args.some(([providers]) => providers.length > 0)).to.equal(false);
			// The write that finished late recreated the login service, so it is removed again.
			expect(LoginServiceConfiguration.removeByService.calledWith('saml')).to.equal(true);
		} finally {
			clock.restore();
		}
	});
});
