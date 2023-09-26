/**
 * @jest-environment node
 */

import { LicenseImp } from '../src';
import { DuplicatedLicenseError } from '../src/errors/DuplicatedLicenseError';
import { InvalidLicenseError } from '../src/errors/InvalidLicenseError';
import { NotReadyForValidation } from '../src/errors/NotReadyForValidation';

const VALID_LICENSE =
	'WMa5i+/t/LZbYOj8u3XUkivRhWBtWO6ycUjaZoVAw2DxMfdyBIAa2gMMI4x7Z2BrTZIZhFEImfOxcXcgD0QbXHGBJaMI+eYG+eofnVWi2VA7RWbpvWTULgPFgyJ4UEFeCOzVjcBLTQbmMSam3u0RlekWJkfAO0KnmLtsaEYNNA2rz1U+CLI/CdNGfdqrBu5PZZbGkH0KEzyIZMaykOjzvX+C6vd7fRxh23HecwhkBbqE8eQsCBt2ad0qC4MoVXsDaSOmSzGW+aXjuXt/9zjvrLlsmWQTSlkrEHdNkdywm0UkGxqz3+CP99n0WggUBioUiChjMuNMoceWvDvmxYP9Ml2NpYU7SnfhjmMFyXOah8ofzv8w509Y7XODvQBz+iB4Co9YnF3vT96HDDQyAV5t4jATE+0t37EAXmwjTi3qqyP7DLGK/revl+mlcwJ5kS4zZBsm1E4519FkXQOZSyWRnPdjqvh4mCLqoispZ49wKvklDvjPxCSP9us6cVXLDg7NTJr/4pfxLPOkvv7qCgugDvlDx17bXpQFPSDxmpw66FLzvb5Id0dkWjOzrRYSXb0bFWoUQjtHFzmcpFkyVhOKrQ9zA9+Zm7vXmU9Y2l2dK79EloOuHMSYAqsPEag8GMW6vI/cT4iIjHGGDePKnD0HblvTEKzql11cfT/abf2IiaY=';

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

		it('should throw an error if the license is duplicated', async () => {
			const license = await getReadyLicenseManager();

			await expect(license.setLicense(VALID_LICENSE)).resolves.toBe(true);
			await expect(license.setLicense(VALID_LICENSE)).rejects.toThrow(DuplicatedLicenseError);
		});
	});
});
