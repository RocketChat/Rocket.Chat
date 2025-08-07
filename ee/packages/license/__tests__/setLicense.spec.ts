/**
 * @jest-environment node
 */

import { LicenseImp } from '../src';
import { MockedLicenseBuilder, getReadyLicenseManager } from './MockedLicenseBuilder';
import { DuplicatedLicenseError } from '../src/errors/DuplicatedLicenseError';
import { InvalidLicenseError } from '../src/errors/InvalidLicenseError';
import { NotReadyForValidation } from '../src/errors/NotReadyForValidation';

// Same license used on ci tasks so no I didnt leak it
const VALID_LICENSE =
	process.env.ENTERPRISE_LICENSE ||
	'Uo7Jcr6WW0XYA8ydHd+Sk6pZ9/0V6dIASnyTwvUrNym/zJg2Ma3eYNKkC8osXLCc72y1ahohnWY7/+7IYkvono3GYXQR+IGvYbbrVgNR6OjMahd9P/odHZL1GFTm2qHrEL5Hh/XEOG+YluFeRdWPzCizQlp4zGGOi0+PkQo096TR9NVCLrsErVl2MW1WM6ZM1W5EUJG9pKly4BQnaOTUAlor1im6i8qPTDCKrISZfLiZEWuQKaPW/GE3mRKjQNjDh0CabX1N2S880pRRGoozBYAnp2NmFfrQW0+5ihKisBTIeMbMZ7K5NE5PkYU1nhQDcc+rpDHtwG9Ceg5X0J+oea3UfrPTmDON2aSI0iO22kvL6G7QI3fyrEIvJrMbxcNKxAFeQYgnjisw/b06+chWSG4jG686Fx58XrVS87dFhWL9WoGltsk1dJCntUQvI1sX6zOfpvyg1iWRnHfYDOrwoWlX57XMm29fWineEoqnOOTOVnA/uP+DKEhercQ9Xuo7Cr6zJxpQpwd03e7ODVjiEbTDqlkZE687rmxRCD4Wmu8L86WIl2xSEIajKLX301Ww5mz/FdLqk+Mg32lkW66W3azQKvJ1440NBrYxhpJ+dl9vSFMb3s1+xnz1cYUbjUcq9mARvORcgy5mLwKulmqT6Sq0Uvbv10YCO0TW0beXYW8=';

describe('License set license procedures', () => {
	describe('Invalid formats', () => {
		it('should have no license by default', async () => {
			const license = new LicenseImp();

			expect(license.hasValidLicense()).toBe(false);
			expect(license.getLicense()).toBeUndefined();
		});

		it('should throw an error if the license applied is empty', async () => {
			const license = new LicenseImp();
			await expect(license.setLicense('')).rejects.toThrow(InvalidLicenseError);
		});

		it('should throw an error if the license applied is invalid', async () => {
			const license = new LicenseImp();
			await expect(license.setLicense('invalid')).rejects.toThrow(InvalidLicenseError);
		});
	});

	describe('Invalid periods', () => {
		it('should throw an error if the license is expired', async () => {
			const license = await getReadyLicenseManager();

			const mocked = new MockedLicenseBuilder();
			const token = await mocked.withExpiredDate().sign();

			await license.setLicense(token);
			expect(license.hasValidLicense()).toBe(false);
		});

		describe('license that is not not started yet is applied', () => {
			it('should throw an error if the license is not started yet', async () => {
				const license = await getReadyLicenseManager();

				const mocked = new MockedLicenseBuilder();
				const token = await mocked.withNotStartedDate().sign();

				await license.setLicense(token);
				expect(license.hasValidLicense()).toBe(false);
			});

			it('should be allowed to set the same license again if the license is not started yet', async () => {
				const license = await getReadyLicenseManager();

				const mocked = new MockedLicenseBuilder();
				const as = mocked.resetValidPeriods().withNotStartedDate();
				const token = await as.sign();

				await license.setLicense(token);

				expect(license.hasValidLicense()).toBe(false);

				// 5 minutes in the future

				const mockedData = new Date();

				mockedData.setMinutes(mockedData.getMinutes() + 5);

				jest.useFakeTimers();
				jest.setSystemTime(mockedData);

				await license.setLicense(token);

				jest.useRealTimers();

				expect(license.hasValidLicense()).toBe(true);
			});
		});
	});

	it('should throw an error if the license is duplicated', async () => {
		const license = await getReadyLicenseManager();

		await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
		await expect(license.setLicense(VALID_LICENSE)).rejects.toThrow(DuplicatedLicenseError);
	});

	it('should keep a valid license if a new invalid formatted license is applied', async () => {
		const license = await getReadyLicenseManager();

		await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
		expect(license.hasValidLicense()).toBe(true);

		await expect(license.setLicense('invalid')).rejects.toThrow(InvalidLicenseError);
		expect(license.hasValidLicense()).toBe(true);
	});

	describe('Pending cases', () => {
		it('should return an error if the license is not ready for validation yet - missing workspace url', async () => {
			const license = new LicenseImp();
			await expect(license.setLicense(VALID_LICENSE)).rejects.toThrow(NotReadyForValidation);
		});

		it('should return an error if the license is not ready for validation yet - missing counters', async () => {
			const license = new LicenseImp();
			await license.setWorkspaceUrl('http://localhost:3000');

			expect(license.getWorkspaceUrl()).toBe('localhost:3000');

			await expect(license.setLicense(VALID_LICENSE)).rejects.toThrow(NotReadyForValidation);

			expect(license.hasValidLicense()).toBe(false);
		});

		it('should return a valid license if the license is ready for validation', async () => {
			const license = await getReadyLicenseManager();

			await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
			expect(license.hasValidLicense()).toBe(true);
		});
	});

	describe('License V3', () => {
		it('should return a valid license if the license is ready for validation', async () => {
			const license = await getReadyLicenseManager();
			const token = await new MockedLicenseBuilder().sign();

			await expect(license.setLicense(token)).resolves.toBe(true);
			expect(license.hasValidLicense()).toBe(true);
		});

		it('should accept new licenses', async () => {
			const license = await getReadyLicenseManager();
			const mocked = new MockedLicenseBuilder();
			const oldToken = await mocked.sign();

			const newToken = await mocked.withGrantedModules(['livechat-enterprise', 'chat.rocket.test-addon']).sign();

			await expect(license.setLicense(oldToken)).resolves.toBe(true);
			expect(license.hasValidLicense()).toBe(true);

			expect(license.hasModule('livechat-enterprise')).toBe(false);
			expect(license.hasModule('chat.rocket.test-addon')).toBe(false);

			await expect(license.setLicense(newToken)).resolves.toBe(true);
			expect(license.hasValidLicense()).toBe(true);
			expect(license.hasModule('livechat-enterprise')).toBe(true);
			expect(license.hasModule('chat.rocket.test-addon')).toBe(true);
		});

		it('should call a validated event after set a valid license', async () => {
			const license = await getReadyLicenseManager();
			const validateCallback = jest.fn();
			license.onValidateLicense(validateCallback);
			await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
			expect(license.hasValidLicense()).toBe(true);
			expect(validateCallback).toHaveBeenCalledTimes(1);
		});

		describe('License limits', () => {
			describe('invalidate license', () => {
				it('should trigger an invalidation event when a license with invalid limits is set after a valid one', async () => {
					const invalidationCallback = jest.fn();

					const licenseManager = await getReadyLicenseManager();
					const mocked = new MockedLicenseBuilder();
					const oldToken = await mocked
						.withLimits('activeUsers', [
							{
								max: 10,
								behavior: 'invalidate_license',
							},
						])
						.sign();

					const newToken = await mocked
						.withLimits('activeUsers', [
							{
								max: 1,
								behavior: 'invalidate_license',
							},
						])
						.sign();

					licenseManager.onInvalidateLicense(invalidationCallback);

					licenseManager.setLicenseLimitCounter('activeUsers', () => 5);

					await expect(licenseManager.setLicense(oldToken)).resolves.toBe(true);
					expect(licenseManager.hasValidLicense()).toBe(true);

					await expect(licenseManager.setLicense(newToken)).resolves.toBe(true);
					expect(licenseManager.hasValidLicense()).toBe(false);

					expect(invalidationCallback).toHaveBeenCalledTimes(1);
				});
			});
		});
	});
});
