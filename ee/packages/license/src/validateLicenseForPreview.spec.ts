import { LicenseImp } from '.';
import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';
import { NotReadyForValidation } from './errors/NotReadyForValidation';

describe('validateLicenseForPreview', () => {
	it('should report a non-license string as invalid with no reasons', async () => {
		const licenseManager = await getReadyLicenseManager();

		const result = await licenseManager.validateLicenseForPreview('not-a-license');

		expect(result).toEqual({ valid: false, reasons: [] });
	});

	it('should throw NotReadyForValidation when the workspace cannot validate yet', async () => {
		const licenseManager = new LicenseImp();
		const license = await new MockedLicenseBuilder().sign();

		await expect(licenseManager.validateLicenseForPreview(license)).rejects.toThrow(NotReadyForValidation);
	});

	it('should report a valid license as valid and not apply it', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGrantedModules(['livechat-enterprise', 'engagement-dashboard']).sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result).toEqual({ valid: true });

		// previewing must not apply the license
		expect(licenseManager.hasValidLicense()).toBe(false);
		expect(licenseManager.getModules()).toEqual([]);
	});

	it('should not apply a license even when it is already active and being previewed again', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withGrantedModules(['livechat-enterprise']).sign();

		await licenseManager.setLicense(license);
		expect(licenseManager.hasValidLicense()).toBe(true);

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result).toEqual({ valid: true });
	});

	it('should report a reason when the workspace URL does not match', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().withServerUrls({ value: 'another-workspace.com', type: 'url' }).sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.valid).toBe(false);
		expect(result.valid === false && result.reasons).toEqual(
			expect.arrayContaining([expect.objectContaining({ behavior: 'invalidate_license', reason: 'url' })]),
		);
	});

	it('should report a reason when an invalidating period has expired', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder().resetValidPeriods().withExpiredDate().sign();

		const result = await licenseManager.validateLicenseForPreview(license);

		expect(result.valid).toBe(false);
		expect(result.valid === false && result.reasons).toEqual(
			expect.arrayContaining([expect.objectContaining({ behavior: 'invalidate_license', reason: 'period' })]),
		);
	});

	it('should report valid when only a disable_modules period has expired', async () => {
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

		// disabling modules does not invalidate the license, so it would still be accepted
		expect(result).toEqual({ valid: true });
	});
});
