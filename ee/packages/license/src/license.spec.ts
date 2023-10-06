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

describe('Validate License Limits', () => {
	describe('fair usage behavior', () => {
		it('should change the flag to true if the counter is equal or over the limit', async () => {
			const licenseManager = await getReadyLicenseManager();

			const fairUsageCallback = jest.fn();

			licenseManager.onBehaviorTriggered('start_fair_policy', fairUsageCallback);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'start_fair_policy',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 10);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 11);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);

			expect(fairUsageCallback).toHaveBeenCalledTimes(2);
		});
	});
	describe('invalidate_license behavior', () => {
		it('should invalidate the license if the counter is equal or over the limit', async () => {
			const licenseManager = await getReadyLicenseManager();

			const invalidateCallback = jest.fn();

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
				{
					max: 10,
					behavior: 'invalidate_license',
				},
			]);

			licenseManager.on('invalidate', invalidateCallback);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			await expect(licenseManager.hasValidLicense()).toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 5);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			await expect(licenseManager.hasValidLicense()).toBe(true);

			await licenseManager.setLicenseLimitCounter('activeUsers', () => 10);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
			await expect(licenseManager.hasValidLicense()).toBe(false);

			expect(invalidateCallback).toHaveBeenCalledTimes(1);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);

			expect(invalidateCallback).toHaveBeenCalledTimes(1);
		});
	});
});
