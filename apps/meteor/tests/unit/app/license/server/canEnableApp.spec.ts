import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IMarketplaceInfo } from '@rocket.chat/apps-engine/server/marketplace';
import { AppInstallationSource, type IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import type { Apps } from '@rocket.chat/core-services';
import type { LicenseImp } from '@rocket.chat/license';
import { expect } from 'chai';

import { _canEnableApp } from '../../../../../ee/app/license/server/canEnableApp';

const getDefaultApp = (): IAppStorageItem => ({
	_id: '6706d9258e0ca97c2f0cc885',
	id: '2e14ff6e-b4d5-4c4c-b12b-b1b1d15ec630',
	info: {
		id: '2e14ff6e-b4d5-4c4c-b12b-b1b1d15ec630',
		version: '0.0.1',
		requiredApiVersion: '^1.19.0',
		iconFile: 'icon.png',
		author: { name: 'a', homepage: 'a', support: 'a' },
		name: 'Add-on test',
		nameSlug: 'add-on-test',
		classFile: 'AddOnTestApp.js',
		description: 'a',
		implements: [],
		iconFileContent: '',
	},
	status: AppStatus.UNKNOWN,
	settings: {},
	implemented: {},
	installationSource: AppInstallationSource.PRIVATE,
	languageContent: {},
	sourcePath: 'GridFS:/6706d9258e0ca97c2f0cc880',
	signature: '',
	createdAt: new Date('2024-10-09T19:27:33.923Z'),
	updatedAt: new Date('2024-10-09T19:27:33.923Z'),
});

// We will be passing promises to the `expect` function
/* eslint-disable @typescript-eslint/no-floating-promises */

describe('canEnableApp', () => {
	it('should throw the message "apps-engine-not-initialized" when appropriate', () => {
		const AppsMock = {
			isInitialized() {
				return false;
			},
		} as unknown as typeof Apps;

		const LicenseMock = {} as unknown as LicenseImp;

		const deps = { Apps: AppsMock, License: LicenseMock };

		return expect(_canEnableApp(deps, getDefaultApp())).to.eventually.be.rejectedWith('apps-engine-not-initialized');
	});

	const AppsMock = {
		isInitialized() {
			return true;
		},
	} as unknown as typeof Apps;

	const LicenseMock = {
		hasModule() {
			return false;
		},
		shouldPreventAction() {
			return true;
		},
		hasValidLicense() {
			return false;
		},
	} as unknown as LicenseImp;

	const deps = { Apps: AppsMock, License: LicenseMock };

	it('should throw the message "app-addon-not-valid" when appropriate', () => {
		const app = getDefaultApp();
		app.info.addon = 'chat.rocket.test-addon';

		return expect(_canEnableApp(deps, app)).to.eventually.be.rejectedWith('app-addon-not-valid');
	});

	it('should throw the message "license-prevented" when appropriate', () => {
		const privateApp = getDefaultApp();
		const marketplaceApp = getDefaultApp();
		marketplaceApp.installationSource = AppInstallationSource.MARKETPLACE;

		return Promise.all([
			expect(_canEnableApp(deps, privateApp)).to.eventually.be.rejectedWith('license-prevented'),
			expect(_canEnableApp(deps, marketplaceApp)).to.eventually.be.rejectedWith('license-prevented'),
		]);
	});

	it('should throw the message "invalid-license" when appropriate', () => {
		const License = { ...LicenseMock, shouldPreventAction: () => false } as unknown as LicenseImp;

		const app = getDefaultApp();
		app.installationSource = AppInstallationSource.MARKETPLACE;
		app.marketplaceInfo = [{ isEnterpriseOnly: true } as IMarketplaceInfo];

		const deps = { Apps: AppsMock, License };

		return expect(_canEnableApp(deps, app)).to.eventually.be.rejectedWith('invalid-license');
	});

	it('should not throw if app is migrated', () => {
		const app = getDefaultApp();
		app.migrated = true;

		return expect(_canEnableApp(deps, app)).to.not.eventually.be.rejected;
	});

	it('should not throw if license allows it', () => {
		const License = {
			hasModule() {
				return true;
			},
			shouldPreventAction() {
				return false;
			},
			hasValidLicense() {
				return true;
			},
		} as unknown as LicenseImp;

		const deps = { Apps: AppsMock, License };

		return expect(_canEnableApp(deps, getDefaultApp())).to.not.eventually.be.rejected;
	});
});
