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

	describe('behavior:prevent_action event', () => {
		it('should emit `behavior:prevent_action` event when the limit is reached', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();

			licenseManager.onBehaviorTriggered('prevent_action', fn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 10);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

			await expect(fn).toBeCalledTimes(1);

			await expect(fn).toBeCalledWith({
				reason: 'limit',
				limit: 'activeUsers',
			});
		});

		it('should emit `limitReached:activeUsers` event when the limit is reached', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();

			licenseManager.onLimitReached('activeUsers', fn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 10);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

			await expect(fn).toBeCalledTimes(1);

			await expect(fn).toBeCalledWith(undefined);
		});
	});

	/**
	 * This event is used to sync multiple instances of license manager
	 * The sync event is triggered when the license is changed, but if the validation is running due to a previous change, no sync should be triggered, avoiding multiple/loops syncs
	 */
	describe('sync event', () => {
		it('should emit `sync` event when the license is changed', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();

			licenseManager.onChange(fn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
				{
					max: 20,
					behavior: 'invalidate_license',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 21);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

			await expect(fn).toBeCalledTimes(1);
		});

		it('should not emit `sync` event when the license validation was triggered by a the sync method', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();

			licenseManager.onChange(fn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
				{
					max: 20,
					behavior: 'invalidate_license',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 21);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

			await expect(fn).toBeCalledTimes(1);

			fn.mockClear();

			await expect(licenseManager.sync()).resolves.toBe(undefined);

			await expect(fn).toBeCalledTimes(0);
		});
	});

	/**
	 * this is only called when the prevent_action behavior is triggered for the first time
	 * it will not be called again until the behavior is toggled
	 */
	describe('Toggled behaviors', () => {
		it('should emit `behaviorToggled:prevent_action` event when the limit is reached once but `behavior:prevent_action` twice', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();
			const toggleFn = jest.fn();

			licenseManager.onBehaviorTriggered('prevent_action', fn);

			licenseManager.onBehaviorToggled('prevent_action', toggleFn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 10);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);

			await expect(fn).toBeCalledTimes(2);
			await expect(toggleFn).toBeCalledTimes(1);

			await expect(fn).toBeCalledWith({
				reason: 'limit',
				limit: 'activeUsers',
			});
		});

		it('should emit `behaviorToggled:allow_action` event when the limit is not reached once but `behavior:allow_action` twice', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();
			const toggleFn = jest.fn();

			licenseManager.onBehaviorTriggered('allow_action', fn);

			licenseManager.onBehaviorToggled('allow_action', toggleFn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 9);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);

			await expect(fn).toBeCalledTimes(2);
			await expect(toggleFn).toBeCalledTimes(0);

			await expect(fn).toBeCalledWith({
				reason: 'limit',
				limit: 'activeUsers',
			});
		});

		it('should emit `behaviorToggled:prevent_action` and `behaviorToggled:allow_action` events when the shouldPreventAction function changes the result', async () => {
			const licenseManager = await getReadyLicenseManager();
			const preventFn = jest.fn();
			const preventToggleFn = jest.fn();
			const allowFn = jest.fn();
			const allowToggleFn = jest.fn();

			licenseManager.onBehaviorTriggered('prevent_action', preventFn);
			licenseManager.onBehaviorToggled('prevent_action', preventToggleFn);
			licenseManager.onBehaviorTriggered('allow_action', allowFn);
			licenseManager.onBehaviorToggled('allow_action', allowToggleFn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 5);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			expect(preventFn).toBeCalledTimes(0);
			expect(preventToggleFn).toBeCalledTimes(0);
			expect(allowFn).toBeCalledTimes(1);
			expect(allowToggleFn).toBeCalledTimes(0);

			preventFn.mockClear();
			preventToggleFn.mockClear();
			allowFn.mockClear();
			allowToggleFn.mockClear();
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			expect(preventFn).toBeCalledTimes(0);
			expect(preventToggleFn).toBeCalledTimes(0);
			expect(allowFn).toBeCalledTimes(1);
			expect(allowToggleFn).toBeCalledTimes(0);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 10);

			preventFn.mockClear();
			preventToggleFn.mockClear();
			allowFn.mockClear();
			allowToggleFn.mockClear();
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
			expect(preventFn).toBeCalledTimes(1);
			expect(preventToggleFn).toBeCalledTimes(1);
			expect(allowFn).toBeCalledTimes(0);
			expect(allowToggleFn).toBeCalledTimes(0);

			preventFn.mockClear();
			preventToggleFn.mockClear();
			allowFn.mockClear();
			allowToggleFn.mockClear();
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(true);
			expect(preventFn).toBeCalledTimes(1);
			expect(preventToggleFn).toBeCalledTimes(0);
			expect(allowFn).toBeCalledTimes(0);
			expect(allowToggleFn).toBeCalledTimes(0);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 5);

			preventFn.mockClear();
			preventToggleFn.mockClear();
			allowFn.mockClear();
			allowToggleFn.mockClear();
			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);
			expect(preventFn).toBeCalledTimes(0);
			expect(preventToggleFn).toBeCalledTimes(0);
			expect(allowFn).toBeCalledTimes(1);
			expect(allowToggleFn).toBeCalledTimes(1);
		});
	});

	describe('Allow actions', () => {
		it('should emit `behavior:allow_action` event when the limit is not reached', async () => {
			const licenseManager = await getReadyLicenseManager();
			const fn = jest.fn();
			const preventFn = jest.fn();

			licenseManager.onBehaviorTriggered('allow_action', fn);
			licenseManager.onBehaviorTriggered('prevent_action', preventFn);

			const license = await new MockedLicenseBuilder().withLimits('activeUsers', [
				{
					max: 10,
					behavior: 'prevent_action',
				},
			]);

			await expect(licenseManager.setLicense(await license.sign())).resolves.toBe(true);

			licenseManager.setLicenseLimitCounter('activeUsers', () => 9);

			await expect(licenseManager.shouldPreventAction('activeUsers')).resolves.toBe(false);

			await expect(fn).toBeCalledTimes(1);
			await expect(preventFn).toBeCalledTimes(0);

			await expect(fn).toBeCalledWith({
				reason: 'limit',
				limit: 'activeUsers',
			});
		});
	});
});
