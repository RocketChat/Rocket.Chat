import { MockedLicenseBuilder, getReadyLicenseManager } from '../../__tests__/MockedLicenseBuilder';

describe('validateLicenseLimits', () => {
	describe('limit max: -1', () => {
		it('should return prevent_action when the limit is reached', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: -1,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 99999999);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
		});
	});
	describe('limit max: 0', () => {
		it('should return prevent_action when the limit is reached', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 0,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 99999999);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
		});
	});
});
