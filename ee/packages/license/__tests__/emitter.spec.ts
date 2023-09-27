/**
 * @jest-environment node
 */

import { LicenseImp } from '../src';
import { MockedLicenseBuilder } from './MockedLicenseBuilder';

const getReadyLicenseManager = async () => {
	const license = new LicenseImp();
	await license.setWorkspaceUrl('http://localhost:3000');
	await license.setWorkspaceUrl('http://localhost:3000');

	license.setLicenseLimitCounter('activeUsers', () => 0);
	license.setLicenseLimitCounter('guestUsers', () => 0);
	license.setLicenseLimitCounter('roomsPerGuest', async () => 0);
	license.setLicenseLimitCounter('privateApps', () => 0);
	license.setLicenseLimitCounter('marketplaceApps', () => 0);
	license.setLicenseLimitCounter('monthlyActiveContacts', async () => 0);
	return license;
};

describe('Module License behaviors', () => {
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
});
