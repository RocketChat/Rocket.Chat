/**
 * @jest-environment node
 */

import { MockedLicenseBuilder } from './MockedLicenseBuilder';
import { getLicenseCreatedAt } from '../src/getLicenseCreatedAt';

describe('getLicenseCreatedAt', () => {
	it('should return the createdAt of a signed V3 license', async () => {
		const createdAt = new Date('2026-01-02T03:04:05.000Z');
		const encrypted = await new MockedLicenseBuilder().withCreatedAt(createdAt).sign();

		await expect(getLicenseCreatedAt(encrypted)).resolves.toEqual(createdAt);
	});

	it('should return undefined for an empty license string', async () => {
		await expect(getLicenseCreatedAt('')).resolves.toBeUndefined();
		await expect(getLicenseCreatedAt('   ')).resolves.toBeUndefined();
	});

	it('should return undefined for a non-V3 license string', async () => {
		await expect(getLicenseCreatedAt('not-a-license')).resolves.toBeUndefined();
	});

	it('should return undefined for a V3 license with a broken signature', async () => {
		const encrypted = await new MockedLicenseBuilder().sign();

		await expect(getLicenseCreatedAt(`${encrypted}corrupted`)).resolves.toBeUndefined();
	});
});
