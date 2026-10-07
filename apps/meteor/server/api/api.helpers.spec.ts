import { License } from '@rocket.chat/license';

import { hasEnterpriseLicense } from './api.helpers';

jest.mock('@rocket.chat/license', () => ({
	License: {
		hasValidLicense: jest.fn(),
	},
}));

describe('api.helpers', () => {
	describe('hasEnterpriseLicense', () => {
		afterEach(() => {
			jest.clearAllMocks();
		});

		it('should return true when the license is valid', () => {
			(License.hasValidLicense as jest.Mock).mockReturnValue(true);

			expect(hasEnterpriseLicense()).toBe(true);
			expect(License.hasValidLicense).toHaveBeenCalledTimes(1);
		});

		it('should return false when the license is invalid', () => {
			(License.hasValidLicense as jest.Mock).mockReturnValue(false);

			expect(hasEnterpriseLicense()).toBe(false);
			expect(License.hasValidLicense).toHaveBeenCalledTimes(1);
		});
	});
});
