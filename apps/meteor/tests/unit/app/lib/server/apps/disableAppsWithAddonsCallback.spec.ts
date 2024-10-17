import { expect, spy } from 'chai';
import proxyquire from 'proxyquire';

import type { AppServerOrchestrator } from '../../../../../../ee/server/apps/orchestrator';

const { _disableAppsWithAddonsCallback } = proxyquire
	.noCallThru()
	.load('../../../../../../ee/server/lib/apps/disableAppsWithAddonsCallback', {
		'../../apps': {},
		'../../../../server/lib/sendMessagesToAdmins': { sendMessagesToAdmins: () => undefined },
		'../../../../server/lib/i18n': {
			i18n: { t: () => undefined },
		},
	});

/**
 * I've used named "empty" functions to spy on as it is easier to
 * troubleshoot if the assertion fails.
 * If we use `spy()` instead, there is no clear indication on the
 * error message which of the spy assertions failed
 */

describe('disableAppsWithAddonsCallback', () => {
	function sendMessagesToAdmins(): any {
		return undefined;
	}

	it('should not execute anything if not external module', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		await _disableAppsWithAddonsCallback({ Apps: AppsMock, sendMessagesToAdmins }, { module: 'auditing', external: false, valid: true });

		expect(AppsMock.installedApps).to.not.have.been.called();
		expect(AppsMock.getManager()?.disable).to.not.have.been.called();
	});

	it('should not execute anything if module is external and valid', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		await _disableAppsWithAddonsCallback({ Apps: AppsMock, sendMessagesToAdmins }, { module: 'auditing', external: true, valid: true });

		expect(AppsMock.installedApps).to.not.have.been.called();
		expect(AppsMock.getManager()?.disable).to.not.have.been.called();
	});

	it('should not throw if there are no apps installed that are enabled', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		await expect(
			_disableAppsWithAddonsCallback({ Apps: AppsMock, sendMessagesToAdmins }, { module: 'auditing', external: true, valid: false }),
		).to.not.eventually.be.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()?.disable).to.not.have.been.called();
	});

	it('should only disable apps that require addons', async () => {
		function installedApps() {
			return [
				{
					getInfo: () => ({}),
					getName: () => 'Test App Without Addon',
					getID() {
						return 'test-app-without-addon';
					},
				},
				{
					getInfo: () => ({ addon: 'chat.rocket.test-addon' }),
					getName: () => 'Test App WITH Addon',
					getID() {
						return 'test-app-with-addon';
					},
				},
			];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		await expect(
			_disableAppsWithAddonsCallback(
				{ Apps: AppsMock, sendMessagesToAdmins },
				{ module: 'chat.rocket.test-addon', external: true, valid: false },
			),
		).to.not.eventually.be.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()?.disable).to.have.been.called.once;
		expect(AppsMock.getManager()?.disable).to.have.been.called.with('test-app-with-addon');
	});

	it('should not send messages to admins if no app was disabled', async () => {
		function installedApps() {
			return [
				{
					getInfo: () => ({}),
					getName: () => 'Test App Without Addon',
					getID() {
						return 'test-app-without-addon';
					},
				},
			];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		const sendMessagesToAdminsSpy = spy(sendMessagesToAdmins);

		await expect(
			_disableAppsWithAddonsCallback(
				{ Apps: AppsMock, sendMessagesToAdmins: sendMessagesToAdminsSpy },
				{ module: 'chat.rocket.test-addon', external: true, valid: false },
			),
		).to.not.eventually.be.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()?.disable).to.not.have.been.called();
		expect(sendMessagesToAdminsSpy).to.not.have.been.called();
	});

	it('should send messages to admins if some app has been disabled', async () => {
		function installedApps() {
			return [
				{
					getInfo: () => ({}),
					getName: () => 'Test App Without Addon',
					getID() {
						return 'test-app-without-addon';
					},
				},
				{
					getInfo: () => ({ addon: 'chat.rocket.test-addon' }),
					getName: () => 'Test App WITH Addon',
					getID() {
						return 'test-app-with-addon';
					},
				},
			];
		}

		function getManagerDisable() {
			return undefined;
		}

		const mockManager = {
			disable: spy(getManagerDisable),
		};

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => mockManager,
		} as unknown as AppServerOrchestrator;

		const sendMessagesToAdminsSpy = spy(sendMessagesToAdmins);

		await expect(
			_disableAppsWithAddonsCallback(
				{ Apps: AppsMock, sendMessagesToAdmins: sendMessagesToAdminsSpy },
				{ module: 'chat.rocket.test-addon', external: true, valid: false },
			),
		).to.not.eventually.be.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()?.disable).to.have.been.called.once;
		expect(sendMessagesToAdminsSpy).to.have.been.called();
	});
});
