import { expect, spy } from 'chai';

import type { AppServerOrchestrator } from '../../../../../../ee/server/apps/orchestrator';
import { makeDisableAppsWithAddonsCallback } from '../../../../../../ee/server/lib/apps/makeDisableAppsWithAddonsCallback';

describe('disableAppsWithAddonsCallback', () => {
	it('should not execute anything if not external module', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => ({
				disable: spy(getManagerDisable),
			}),
		} as unknown as AppServerOrchestrator;

		const disableAppsWithAddonsCallback = makeDisableAppsWithAddonsCallback({ Apps: AppsMock });

		await disableAppsWithAddonsCallback({ module: 'auditing', external: false, valid: true });

		expect(AppsMock.installedApps).to.not.have.been.called();
		expect(AppsMock.getManager()!.disable).to.not.have.been.called();
	});

	it('should not execute anything if module is external and valid', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => ({
				disable: spy(getManagerDisable),
			}),
		} as unknown as AppServerOrchestrator;

		const disableAppsWithAddonsCallback = makeDisableAppsWithAddonsCallback({ Apps: AppsMock });

		await disableAppsWithAddonsCallback({ module: 'auditing', external: true, valid: true });

		expect(AppsMock.installedApps).to.not.have.been.called();
		expect(AppsMock.getManager()!.disable).to.not.have.been.called();
	});

	it('should not throw if there are no apps installed that are enabled', async () => {
		function installedApps() {
			return [];
		}

		function getManagerDisable() {
			return undefined;
		}

		const AppsMock = {
			installedApps: spy(installedApps),
			getManager: () => ({
				disable: spy(getManagerDisable),
			}),
		} as unknown as AppServerOrchestrator;

		const disableAppsWithAddonsCallback = makeDisableAppsWithAddonsCallback({ Apps: AppsMock });

		await expect(disableAppsWithAddonsCallback({ module: 'auditing', external: true, valid: false })).to.not.eventually.be.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()!.disable).to.not.have.been.called();
	});

	it('should only disable apps that require addons', async () => {
		function installedApps() {
			return [
				{
					getInfo: () => ({}),
					getID() {
						return 'test-app-without-addon';
					},
				},
				{
					getInfo: () => ({ addon: 'chat.rocket.test-addon' }),
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

		const disableAppsWithAddonsCallback = makeDisableAppsWithAddonsCallback({ Apps: AppsMock });

		await expect(disableAppsWithAddonsCallback({ module: 'chat.rocket.test-addon', external: true, valid: false })).to.not.eventually.be
			.rejected;

		expect(AppsMock.installedApps).to.have.been.called();
		expect(AppsMock.getManager()!.disable).to.have.been.called.once;
		expect(AppsMock.getManager()!.disable).to.have.been.called.with('test-app-with-addon');
	});
});
