import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';

it('should not prevent if there is no license', async () => {
	const license = await getReadyLicenseManager();
	const result = await license.shouldPreventAction('activeUsers');
	expect(result).toBe(false);
});

it('should not prevent if the counter is under the limit', async () => {
	const licenseManager = await getReadyLicenseManager();

	const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
		{
			max: 10,
			behavior: 'prevent_action',
		},
	]);

	await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

	licenseManager.setLicenseLimitCounter('activeUsers', () => 5);
	await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
});

it('should prevent if the counter is equal or over the limit', async () => {
	const licenseManager = await getReadyLicenseManager();

	const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
		{
			max: 10,
			behavior: 'prevent_action',
		},
	]);

	await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

	licenseManager.setLicenseLimitCounter('activeUsers', () => 10);
	await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

	licenseManager.setLicenseLimitCounter('activeUsers', () => 11);
	await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
});
