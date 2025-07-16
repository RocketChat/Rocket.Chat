import type { LicenseModule } from '@rocket.chat/core-typings';

import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';

describe('getModules', () => {
	it('should return internal and external', async () => {
		const licenseManager = await getReadyLicenseManager();

		const modules = ['auditing', 'livechat-enterprise', 'ldap-enterprise', 'chat.rocket.test-addon'] as LicenseModule[];

		const license = await new MockedLicenseBuilder().withGratedModules(modules).sign();

		await expect(licenseManager.setLicense(license)).resolves.toBe(true);

		expect(licenseManager.getModules()).toContain('auditing');
		expect(licenseManager.getModules()).toContain('livechat-enterprise');
		expect(licenseManager.getModules()).toContain('ldap-enterprise');
		expect(licenseManager.getModules()).toContain('chat.rocket.test-addon');
	});
});

describe('getModuleDefinition', () => {
	it('should not return `external` property for an internal module', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGratedModules(['auditing', 'chat.rocket.test-addon']).sign();

		await licenseManager.setLicense(license);

		const module = licenseManager.getModuleDefinition('auditing');

		expect(module).toMatchObject({ module: 'auditing' });
	});

	it('should return `undefined` for a non-existing module', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGratedModules(['auditing', 'chat.rocket.test-addon']).sign();

		await licenseManager.setLicense(license);

		const module = licenseManager.getModuleDefinition('livechat-enterprise');

		expect(module).toBeUndefined();
	});

	it('should return `undefined` if there is no license available', async () => {
		const licenseManager = await getReadyLicenseManager();

		const module = licenseManager.getModuleDefinition('livechat-enterprise');

		expect(module).toBeUndefined();
	});

	it('should return `external` property for an external module', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGratedModules(['auditing', 'chat.rocket.test-addon']).sign();

		await licenseManager.setLicense(license);

		const module = licenseManager.getModuleDefinition('chat.rocket.test-addon');

		expect(module).toMatchObject({ module: 'chat.rocket.test-addon', external: true });
	});
});

describe('getExternalModules', () => {
	it('should return only external modules', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGratedModules(['auditing', 'chat.rocket.test-addon']).sign();

		await licenseManager.setLicense(license);

		const modules = licenseManager.getExternalModules();

		expect(modules).toHaveLength(1);
		expect(modules[0]).toMatchObject({ external: true, module: 'chat.rocket.test-addon' });
	});

	it('should return empty array if no external module is present', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGratedModules(['auditing', 'livechat-enterprise']).sign();

		await licenseManager.setLicense(license);

		const modules = licenseManager.getExternalModules();

		expect(modules).toHaveLength(0);
	});

	it('should return empty array if license is not available', async () => {
		const licenseManager = await getReadyLicenseManager();

		const modules = licenseManager.getExternalModules();

		expect(modules).toHaveLength(0);
	});
});
