import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';

describe('validateLicenseForPreview', () => {
	it('should report an invalid format for a non-license string', async () => {
		const licenseManager = await getReadyLicenseManager();

		const result = await licenseManager.validateLicenseForPreview('not-a-license');

		expect(result.isFormatValid).toBe(false);
		expect(result.isValid).toBe(false);
		expect(result.license).toBeUndefined();
		expect(result.grantedModules).toEqual([]);
	});

	it('should preview a valid license without applying it', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder()
			.withGrantedModules(['livechat-enterprise', 'engagement-dashboard'])
			.sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.isFormatValid).toBe(true);
		expect(result.isValid).toBe(true);
		expect(result.license?.version).toBe('3.0');
		expect(result.grantedModules).toEqual(expect.arrayContaining(['livechat-enterprise', 'engagement-dashboard']));
		expect(result.validationErrors).toEqual([]);

		// previewing must not apply the license
		expect(licenseManager.hasValidLicense()).toBe(false);
		expect(licenseManager.getModules()).toEqual([]);
	});

	it('should not apply a license even when it is already active and being previewed again', async () => {
		const licenseManager = await getReadyLicenseManager();

		const builder = new MockedLicenseBuilder().withGrantedModules(['livechat-enterprise']);
		const license = await builder.sign();

		await licenseManager.setLicense(license);
		expect(licenseManager.hasValidLicense()).toBe(true);

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.isFormatValid).toBe(true);
		expect(result.isValid).toBe(true);
	});

	it('should report an invalid license when the workspace URL does not match', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder()
			.withServerUrls({ value: 'another-workspace.com', type: 'url' })
			.sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.isFormatValid).toBe(true);
		expect(result.isValid).toBe(false);
		expect(result.validationErrors).toEqual(
			expect.arrayContaining([expect.objectContaining({ behavior: 'invalidate_license', reason: 'url' })]),
		);
	});

	it('should report an invalid license when an invalidating period has expired', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().resetValidPeriods().withExpiredDate().sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.isFormatValid).toBe(true);
		expect(result.isValid).toBe(false);
		expect(result.validationErrors).toEqual(
			expect.arrayContaining([expect.objectContaining({ behavior: 'invalidate_license', reason: 'period' })]),
		);
	});

	it('should still be valid but exclude modules disabled by an expired period', async () => {
		const licenseManager = await getReadyLicenseManager();

		// MockedLicenseBuilder seeds a `disable_modules` period for `livechat-enterprise`; expire it.
		const builder = new MockedLicenseBuilder().withGrantedModules(['livechat-enterprise', 'engagement-dashboard']);
		builder.validation.validPeriods = [
			{
				invalidBehavior: 'disable_modules',
				modules: ['livechat-enterprise'],
				validUntil: new Date(new Date().setMinutes(new Date().getMinutes() - 1)).toISOString(),
			},
		];

		const result = await licenseManager.validateLicenseForPreview(await builder.sign());

		expect(result.isValid).toBe(true);
		expect(result.grantedModules).toContain('engagement-dashboard');
		expect(result.grantedModules).not.toContain('livechat-enterprise');
	});
});
