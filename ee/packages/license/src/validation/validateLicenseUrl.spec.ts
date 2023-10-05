/**
 * @jest-environment node
 */

import crypto from 'crypto';

import { MockedLicenseBuilder, getReadyLicenseManager } from '../../__tests__/MockedLicenseBuilder';
import { validateLicenseUrl } from './validateLicenseUrl';

describe('Url Validation', () => {
	describe('url method', () => {
		it('should return a behavior if the license url is invalid', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withServerUrls({
				value: 'localhost:3001',
				type: 'url',
			});

			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([
				{
					behavior: 'invalidate_license',
					limit: undefined,
					reason: 'url',
				},
			]);
		});

		it('should return an empty array if the license url is valid', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withServerUrls({
				value: 'localhost:3000',
				type: 'url',
			});

			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([]);
		});
	});

	describe('regex method', () => {
		it('should return a behavior if the license does not match the regex', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withServerUrls({
				value: 'unstable.rocket.*',
				type: 'regex',
			});

			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([
				{
					behavior: 'invalidate_license',
					limit: undefined,
					reason: 'url',
				},
			]);
		});

		it('should return an empty array if the license matches the regex', async () => {
			const licenseManager = await getReadyLicenseManager();

			const license = await new MockedLicenseBuilder().withServerUrls({
				value: 'localhost:300*',
				type: 'regex',
			});

			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([]);
		});
	});

	describe('hash method', () => {
		it('should return a behavior if the license does not match the hash', async () => {
			const licenseManager = await getReadyLicenseManager();

			const hash = crypto.createHash('sha256').update('localhost:3001').digest('hex');
			const license = await new MockedLicenseBuilder().withServerUrls({
				value: hash,
				type: 'hash',
			});

			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([
				{
					behavior: 'invalidate_license',
					limit: undefined,
					reason: 'url',
				},
			]);
		});
		it('should return an empty array if the license matches the hash', async () => {
			const licenseManager = await getReadyLicenseManager();

			const hash = crypto.createHash('sha256').update('localhost:3000').digest('hex');
			const license = await new MockedLicenseBuilder().withServerUrls({
				value: hash,
				type: 'hash',
			});
			await expect(
				validateLicenseUrl.call(licenseManager, await license.build(), {
					behaviors: ['invalidate_license', 'prevent_installation', 'start_fair_policy', 'disable_modules'],
					suppressLog: true,
				}),
			).toStrictEqual([]);
		});
	});
});
