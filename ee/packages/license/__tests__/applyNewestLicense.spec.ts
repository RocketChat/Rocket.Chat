/**
 * @jest-environment node
 */

import { MockedLicenseBuilder, getReadyLicenseManager } from './MockedLicenseBuilder';
import { applyNewestLicense } from '../src/applyLicense';

const OLDER = new Date('2026-01-01T00:00:00.000Z');
const NEWER = new Date('2026-06-01T00:00:00.000Z');

describe('applyNewestLicense', () => {
	it('should apply the provided license when it is newer than the stored one', async () => {
		const manager = await getReadyLicenseManager();
		const stored = await new MockedLicenseBuilder().withCreatedAt(OLDER).withGrantedModules(['auditing']).sign();
		const provided = await new MockedLicenseBuilder().withCreatedAt(NEWER).withGrantedModules(['livechat-enterprise']).sign();

		await expect(applyNewestLicense(manager, stored, provided)).resolves.toBe(true);

		expect(manager.hasValidLicense()).toBe(true);
		expect(manager.hasModule('livechat-enterprise')).toBe(true);
		expect(manager.hasModule('auditing')).toBe(false);
	});

	it('should apply the dated provided license when the stored one has no issue date', async () => {
		const manager = await getReadyLicenseManager();

		// V2 licenses carry no signature-verified issue date, so they must sort as the oldest
		const storedBuilder = new MockedLicenseBuilder().withGrantedModules(['auditing']);
		storedBuilder.information.createdAt = 'not-a-date';
		const stored = await storedBuilder.sign();

		const provided = await new MockedLicenseBuilder().withCreatedAt(NEWER).withGrantedModules(['livechat-enterprise']).sign();

		await expect(applyNewestLicense(manager, stored, provided)).resolves.toBe(true);

		expect(manager.hasModule('livechat-enterprise')).toBe(true);
		expect(manager.hasModule('auditing')).toBe(false);
	});

	it('should apply the stored license when it is newer than the provided one', async () => {
		const manager = await getReadyLicenseManager();
		const stored = await new MockedLicenseBuilder().withCreatedAt(NEWER).withGrantedModules(['auditing']).sign();
		const provided = await new MockedLicenseBuilder().withCreatedAt(OLDER).withGrantedModules(['livechat-enterprise']).sign();

		await expect(applyNewestLicense(manager, stored, provided)).resolves.toBe(true);

		expect(manager.hasModule('auditing')).toBe(true);
		expect(manager.hasModule('livechat-enterprise')).toBe(false);
	});

	it('should apply the provided license when there is no stored license', async () => {
		const manager = await getReadyLicenseManager();
		const provided = await new MockedLicenseBuilder().withCreatedAt(OLDER).withGrantedModules(['livechat-enterprise']).sign();

		await expect(applyNewestLicense(manager, '', provided)).resolves.toBe(true);

		expect(manager.hasModule('livechat-enterprise')).toBe(true);
	});

	it('should fall back to the provided license when the newer stored one fails to apply', async () => {
		const manager = await getReadyLicenseManager();
		const stored = await new MockedLicenseBuilder().withCreatedAt(NEWER).withExpiredDate().withGrantedModules(['auditing']).sign();
		const provided = await new MockedLicenseBuilder().withCreatedAt(OLDER).withGrantedModules(['livechat-enterprise']).sign();

		await expect(applyNewestLicense(manager, stored, provided)).resolves.toBe(true);

		expect(manager.hasModule('livechat-enterprise')).toBe(true);
	});

	it('should fall back to the stored license when the newer provided one is corrupted', async () => {
		const manager = await getReadyLicenseManager();
		const stored = await new MockedLicenseBuilder().withCreatedAt(OLDER).withGrantedModules(['auditing']).sign();
		const provided = `${await new MockedLicenseBuilder().withCreatedAt(NEWER).sign()}corrupted`;

		await expect(applyNewestLicense(manager, stored, provided)).resolves.toBe(true);

		expect(manager.hasModule('auditing')).toBe(true);
	});

	it('should return false when neither license is provided', async () => {
		const manager = await getReadyLicenseManager();

		await expect(applyNewestLicense(manager, '', '')).resolves.toBe(false);

		expect(manager.hasValidLicense()).toBe(false);
	});
});
