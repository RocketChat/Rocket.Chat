import { expect } from 'chai';
import proxyquire from 'proxyquire';

const proxySettings = {
	settings: {
		get: (key: string): string | null => {
			if (key === 'UTF8_User_Names_Validation') {
				// Default value set at apps/meteor/server/settings/general.ts
				return '[0-9a-zA-Z-_.]+';
			}
			return null;
		},
	},
};

const { validateUsername } = proxyquire.noCallThru().load('../../../../../../app/lib/server/functions/validateUsername', {
	'../../../settings/server': proxySettings,
});

describe('validateUsername', () => {
	describe('with default settings', () => {
		it('should return true for a valid username', () => {
			const result = validateUsername('valid_username.123');
			expect(result).to.be.true;
		});

		it('should return false for an invalid username containing special HTML tags', () => {
			const result = validateUsername('username<div>$</div>');
			expect(result).to.be.false;
		});

		it('should return false for an empty username', () => {
			const result = validateUsername('');
			expect(result).to.be.false;
		});

		it('should return false for a username with invalid characters', () => {
			const result = validateUsername('invalid*username!');
			expect(result).to.be.false;
		});

		it('should return true for a username with allowed special characters', () => {
			const result = validateUsername('username-_.');
			expect(result).to.be.true;
		});
	});

	describe('with custom regex settings', () => {
		beforeEach(() => {
			proxySettings.settings.get = (key: string) => {
				if (key === 'UTF8_User_Names_Validation') {
					return '[a-zA-Z]+';
				}
				return null;
			};
		});

		it('should return true for a username matching the custom regex', () => {
			const result = validateUsername('ValidUsername');
			expect(result).to.be.true;
		});

		it('should return false for a username that does not match the custom regex', () => {
			const result = validateUsername('username123');
			expect(result).to.be.false;
		});
	});

	describe('with null regex settings', () => {
		beforeEach(() => {
			proxySettings.settings.get = () => null;
		});

		it('should fallback to the default regex pattern if the settings value is null', () => {
			const result = validateUsername('username');
			expect(result).to.be.true;
		});
	});

	describe('with invalid regex settings', () => {
		beforeEach(() => {
			proxySettings.settings.get = (key: string) => {
				if (key === 'UTF8_User_Names_Validation') {
					return 'invalid[';
				}
				return null;
			};
		});

		it('should fallback to the default regex pattern if the settings value is invalid', () => {
			const result = validateUsername('username');
			expect(result).to.be.true;
		});
	});
});
