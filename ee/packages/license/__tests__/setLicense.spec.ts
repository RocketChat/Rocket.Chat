/**
 * @jest-environment node
 */

import { LicenseImp } from '../src';
import { DuplicatedLicenseError } from '../src/errors/DuplicatedLicenseError';
import { InvalidLicenseError } from '../src/errors/InvalidLicenseError';
import { NotReadyForValidation } from '../src/errors/NotReadyForValidation';
import { MockedLicenseBuilder, getReadyLicenseManager } from './MockedLicenseBuilder';

// Same license used on ci tasks so no I didnt leak it
const VALID_LICENSE =
	'WMa5i+/t/LZbYOj8u3XUkivRhWBtWO6ycUjaZoVAw2DxMfdyBIAa2gMMI4x7Z2BrTZIZhFEImfOxcXcgD0QbXHGBJaMI+eYG+eofnVWi2VA7RWbpvWTULgPFgyJ4UEFeCOzVjcBLTQbmMSam3u0RlekWJkfAO0KnmLtsaEYNNA2rz1U+CLI/CdNGfdqrBu5PZZbGkH0KEzyIZMaykOjzvX+C6vd7fRxh23HecwhkBbqE8eQsCBt2ad0qC4MoVXsDaSOmSzGW+aXjuXt/9zjvrLlsmWQTSlkrEHdNkdywm0UkGxqz3+CP99n0WggUBioUiChjMuNMoceWvDvmxYP9Ml2NpYU7SnfhjmMFyXOah8ofzv8w509Y7XODvQBz+iB4Co9YnF3vT96HDDQyAV5t4jATE+0t37EAXmwjTi3qqyP7DLGK/revl+mlcwJ5kS4zZBsm1E4519FkXQOZSyWRnPdjqvh4mCLqoispZ49wKvklDvjPxCSP9us6cVXLDg7NTJr/4pfxLPOkvv7qCgugDvlDx17bXpQFPSDxmpw66FLzvb5Id0dkWjOzrRYSXb0bFWoUQjtHFzmcpFkyVhOKrQ9zA9+Zm7vXmU9Y2l2dK79EloOuHMSYAqsPEag8GMW6vI/cT4iIjHGGDePKnD0HblvTEKzql11cfT/abf2IiaY=';

describe('License set license procedures', () => {
	describe('Invalid formats', () => {
		it('by default it should have no license', async () => {
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

	it('should throw an error if the license is duplicated', async () => {
		const license = await getReadyLicenseManager();

		await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
		await expect(license.setLicense(VALID_LICENSE)).rejects.toThrow(DuplicatedLicenseError);
	});

	it('should keep a valid license if a new invalid license is applied', async () => {
		const license = await getReadyLicenseManager();

		await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
		await expect(license.hasValidLicense()).toBe(true);

		await expect(license.setLicense('invalid')).rejects.toThrow(InvalidLicenseError);
		await expect(license.hasValidLicense()).toBe(true);
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

			await expect(license.hasValidLicense()).toBe(false);
		});

		it('should return a valid license if the license is ready for validation', async () => {
			const license = await getReadyLicenseManager();

			await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
			await expect(license.hasValidLicense()).toBe(true);
		});
	});

	describe('License V3', () => {
		it('should return a valid license if the license is ready for validation', async () => {
			const license = await getReadyLicenseManager();
			const token = await new MockedLicenseBuilder().sign();

			await expect(license.setLicense(token)).resolves.toBe(true);
			await expect(license.hasValidLicense()).toBe(true);
		});

		it('should accept new licenses', async () => {
			const license = await getReadyLicenseManager();
			const mocked = await new MockedLicenseBuilder();
			const oldToken = await mocked.sign();

			const newToken = await mocked.withGratedModules(['livechat-enterprise']).sign();

			await expect(license.setLicense(oldToken)).resolves.toBe(true);
			await expect(license.hasValidLicense()).toBe(true);

			await expect(license.hasModule('livechat-enterprise')).toBe(false);

			await expect(license.setLicense(newToken)).resolves.toBe(true);
			await expect(license.hasValidLicense()).toBe(true);
			await expect(license.hasModule('livechat-enterprise')).toBe(true);
		});
	});
});
