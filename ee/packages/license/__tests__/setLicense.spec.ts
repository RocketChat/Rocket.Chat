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
	'MK+bpK5NveUuNlWGaQXGoy+8b74Luet82M3ZGcBB8b5P9Y+m67NEtpW64dc1d5lEWi6d0nFjCjtCMneVD7bKxodz/Cml8URKEo5P7cQb/9wmeT0MzAhYNaRFZlIGkZ3ITF59pDV2u4HZuosEDJikVRwnaJ5ZoU/pOsHSPUPhTyGNIqLeKynODtUpfwDdIKEmHxpf2yVkKjgRiIJmbWjM6A4k+MNNYXWVXHzye7GggqWVg/ZcT7nKU1CCadpLhTJiIrgrrPzil1G5DQ4xnLs3Q2tu2dILSDiW5OYw/ywu2yCMicTjMq4MLL5SXDQJj6WoJzZ54HosbvsDzOXvsdC9gI1CjhPL2uRuvC8XLrzn3vL2UgXnifzD1VrLTtdZ+aSADveqtlzYlRWtqoUFBbNw8o+YVHdhbZGR0beMoAyRbHi5EMpxpad3L+NyztUIT/Uh/IjQ/C2SQZ6jB0GKPBOPxFLN56FNhTGrffLFR++TVoBu0Iquc7kajWkNit3bVbZvbx+oFcVW2PcjQ/+i2jpJjbgtUFUKrTKxGMAXTWoDzIQQ35zNzGAy268IM4Ymp5JmsVEnBOEUkbF9yx6fzkO6xZhpsHf0muklnW0kA+Tlore/TUrBWh1/RwWlQeZlxM5NyWoRM5onQmr/k/4BmObtL1Hpmbk8oMG29z89xtE9y/4=';

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
