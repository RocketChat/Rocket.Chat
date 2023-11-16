import { LicenseImp } from '../src';

describe('Community Restrictions', () => {
	describe('Apps from marketplace', () => {
		it('should respect the default if there is no license applied', async () => {
			const license = new LicenseImp();

			license.setLicenseLimitCounter('marketplaceApps', () => 1);

			await expect(await license.shouldPreventAction('marketplaceApps')).toBe(false);

			license.setLicenseLimitCounter('marketplaceApps', () => 10);

			await expect(await license.shouldPreventAction('marketplaceApps')).toBe(true);
		});
	});

	describe('Private Apps', () => {
		it('should respect the default if there is no license applied', async () => {
			const license = new LicenseImp();

			license.setLicenseLimitCounter('privateApps', () => 1);

			await expect(await license.shouldPreventAction('privateApps')).toBe(false);

			license.setLicenseLimitCounter('privateApps', () => 10);

			await expect(await license.shouldPreventAction('privateApps')).toBe(true);
		});
	});

	describe('Active Users', () => {
		it('should respect the default if there is no license applied', async () => {
			const license = new LicenseImp();

			license.setLicenseLimitCounter('activeUsers', () => 1);

			await expect(await license.shouldPreventAction('activeUsers')).toBe(false);

			license.setLicenseLimitCounter('activeUsers', () => 10);

			await expect(await license.shouldPreventAction('activeUsers')).toBe(false);

			license.setLicenseLimitCounter('activeUsers', () => 100000);

			await expect(await license.shouldPreventAction('activeUsers')).toBe(false);
		});
	});
});
