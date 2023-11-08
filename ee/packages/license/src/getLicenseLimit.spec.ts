import { LicenseImp } from '.';
import { MockedLicenseBuilder, getReadyLicenseManager } from '../__tests__/MockedLicenseBuilder';
import { getAppsConfig } from './deprecated';

describe('Marketplace Restrictions', () => {
	it('should respect the default if there is no license applied', async () => {
		const LicenseManager = new LicenseImp();

		expect(getAppsConfig.call(LicenseManager)).toEqual({
			maxPrivateApps: 3,
			maxMarketplaceApps: 5,
		});
	});

	it('should return unlimited if there is license but no limits', async () => {
		const licenseManager = await getReadyLicenseManager();

		const license = await new MockedLicenseBuilder();

		await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

		await expect(getAppsConfig.call(licenseManager)).toEqual({
			maxPrivateApps: -1,
			maxMarketplaceApps: -1,
		});
	});
});
