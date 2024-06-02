/**
 * @jest-environment node
 */

import { MockedLicenseBuilder, getReadyLicenseManager } from '../../__tests__/MockedLicenseBuilder';
import { runValidation } from './runValidation';

describe('Validation behaviors', () => {
	it('should return a behavior if the license period is invalid', async () => {
		const licenseManager = await getReadyLicenseManager();

		// two days ago
		const validFrom = new Date(new Date().setDate(new Date().getDate() - 2));
		// one day ago
		const validUntil = new Date(new Date().setDate(new Date().getDate() - 1));

		const license = await new MockedLicenseBuilder().resetValidPeriods().withValidPeriod({
			validFrom: validFrom.toISOString(),
			validUntil: validUntil.toISOString(),
			invalidBehavior: 'disable_modules',
			modules: ['livechat-enterprise'],
		});

		await expect(
			runValidation.call(licenseManager, await license.build(), {
				behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
				suppressLog: true,
			}),
		).resolves.toStrictEqual([
			{
				behavior: 'disable_modules',
				limit: undefined,
				modules: ['livechat-enterprise'],
				reason: 'period',
			},
		]);
	});
});
