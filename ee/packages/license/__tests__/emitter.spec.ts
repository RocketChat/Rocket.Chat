/**
 * @jest-environment node
 */

import { MockedLicenseBuilder, getReadyLicenseManager } from './MockedLicenseBuilder';

describe('Event License behaviors', () => {
	it('should call the module as they are enabled/disabled', async () => {
		const license = await getReadyLicenseManager();
		const validFn = jest.fn();
		const invalidFn = jest.fn();

		license.onValidFeature('livechat-enterprise', validFn);
		license.onInvalidFeature('livechat-enterprise', invalidFn);

		const mocked = await new MockedLicenseBuilder();
		const oldToken = await mocked.sign();

		const newToken = await mocked.withGratedModules(['livechat-enterprise']).sign();

		// apply license
		await expect(license.setLicense(oldToken)).resolves.toBe(true);
		await expect(license.hasValidLicense()).toBe(true);

		await expect(license.hasModule('livechat-enterprise')).toBe(false);

		await expect(validFn).not.toBeCalled();
		await expect(invalidFn).toBeCalledTimes(1);

		// apply license containing livechat-enterprise module

		validFn.mockClear();
		invalidFn.mockClear();

		await expect(license.setLicense(newToken)).resolves.toBe(true);
		await expect(license.hasValidLicense()).toBe(true);
		await expect(license.hasModule('livechat-enterprise')).toBe(true);

		await expect(validFn).toBeCalledTimes(1);
		await expect(invalidFn).toBeCalledTimes(0);

		// apply the old license again

		validFn.mockClear();
		invalidFn.mockClear();
		await expect(license.setLicense(oldToken)).resolves.toBe(true);
		await expect(license.hasValidLicense()).toBe(true);
		await expect(license.hasModule('livechat-enterprise')).toBe(false);
		await expect(validFn).toBeCalledTimes(0);
		await expect(invalidFn).toBeCalledTimes(1);
	});

	it('should call `onValidateLicense` when a valid license is applied', async () => {
		const license = await getReadyLicenseManager();
		const fn = jest.fn();

		license.onValidateLicense(fn);

		const mocked = await new MockedLicenseBuilder();
		const token = await mocked.sign();

		await expect(license.setLicense(token)).resolves.toBe(true);
		await expect(license.hasValidLicense()).toBe(true);
		await expect(fn).toBeCalledTimes(1);
	});
});
