import { PasswordPolicy } from './PasswordPolicy';
import { PasswordPolicyError } from './index';

describe('Password tests with default options', () => {
	it('should allow all passwords', () => {
		const passwordPolicy = new PasswordPolicy({ throwError: false });
		expect(passwordPolicy.validate(null as any)).toBe(false);
		expect(passwordPolicy.validate(undefined as any)).toBe(false);
		expect(passwordPolicy.validate('')).toBe(false);
		expect(passwordPolicy.validate('            ')).toBe(false);
		expect(passwordPolicy.validate('a')).toBe(true);
		expect(passwordPolicy.validate('aaaaaaaaa')).toBe(true);
	});
});

describe('Password tests with options', () => {
	it('should not allow non string or empty', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			throwError: false,
		});
		expect(passwordPolicy.validate(null as any)).toBe(false);
		expect(passwordPolicy.validate(undefined as any)).toBe(false);
		expect(passwordPolicy.validate(1 as any)).toBe(false);
		expect(passwordPolicy.validate(true as any)).toBe(false);
		expect(passwordPolicy.validate(new Date() as any)).toBe(false);
		expect(passwordPolicy.validate(new Function() as any)).toBe(false);
		expect(passwordPolicy.validate('')).toBe(false);
	});

	it('should restrict by minLength', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			minLength: 5,
			throwError: false,
		});

		expect(passwordPolicy.validate('1')).toBe(false);
		expect(passwordPolicy.validate('1234')).toBe(false);
		expect(passwordPolicy.validate('12345')).toBe(true);
		expect(passwordPolicy.validate('     ')).toBe(false);
	});

	it('should restrict by maxLength', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			maxLength: 5,
			throwError: false,
		});

		expect(passwordPolicy.validate('1')).toBe(true);
		expect(passwordPolicy.validate('12345')).toBe(true);
		expect(passwordPolicy.validate('123456')).toBe(false);
		expect(passwordPolicy.validate('      ')).toBe(false);
	});

	it('should allow repeated characters', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			forbidRepeatingCharacters: false,
			throwError: false,
		});

		expect(passwordPolicy.validate('1')).toBe(true);
		expect(passwordPolicy.validate('12345')).toBe(true);
		expect(passwordPolicy.validate('123456')).toBe(true);
		expect(passwordPolicy.validate('      ')).toBe(false);
		expect(passwordPolicy.validate('11111111111111')).toBe(true);
	});

	it('should restrict repeated characters', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			forbidRepeatingCharacters: true,
			forbidRepeatingCharactersCount: 3,
			throwError: false,
		});

		expect(passwordPolicy.validate('1')).toBe(true);
		expect(passwordPolicy.validate('11')).toBe(true);
		expect(passwordPolicy.validate('111')).toBe(true);
		expect(passwordPolicy.validate('1111')).toBe(false);
		expect(passwordPolicy.validate('     ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(true);
	});

	it('should restrict repeated characters customized', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			forbidRepeatingCharacters: true,
			forbidRepeatingCharactersCount: 5,
			throwError: false,
		});

		expect(passwordPolicy.validate('1')).toBe(true);
		expect(passwordPolicy.validate('11')).toBe(true);
		expect(passwordPolicy.validate('111')).toBe(true);
		expect(passwordPolicy.validate('1111')).toBe(true);
		expect(passwordPolicy.validate('11111')).toBe(true);
		expect(passwordPolicy.validate('111111')).toBe(false);
		expect(passwordPolicy.validate('      ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(true);
	});

	it('should contain one lowercase', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			mustContainAtLeastOneLowercase: true,
			throwError: false,
		});

		expect(passwordPolicy.validate('a')).toBe(true);
		expect(passwordPolicy.validate('aa')).toBe(true);
		expect(passwordPolicy.validate('A')).toBe(false);
		expect(passwordPolicy.validate('   ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(false);
		expect(passwordPolicy.validate('AAAAA')).toBe(false);
		expect(passwordPolicy.validate('AAAaAAA')).toBe(true);
	});

	it('should contain one uppercase', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			mustContainAtLeastOneUppercase: true,
			throwError: false,
		});

		expect(passwordPolicy.validate('a')).toBe(false);
		expect(passwordPolicy.validate('aa')).toBe(false);
		expect(passwordPolicy.validate('A')).toBe(true);
		expect(passwordPolicy.validate('   ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(false);
		expect(passwordPolicy.validate('AAAAA')).toBe(true);
		expect(passwordPolicy.validate('AAAaAAA')).toBe(true);
	});

	it('should contain one number', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			mustContainAtLeastOneNumber: true,
			throwError: false,
		});

		expect(passwordPolicy.validate('a')).toBe(false);
		expect(passwordPolicy.validate('aa')).toBe(false);
		expect(passwordPolicy.validate('A')).toBe(false);
		expect(passwordPolicy.validate('   ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(true);
		expect(passwordPolicy.validate('AAAAA')).toBe(false);
		expect(passwordPolicy.validate('AAAaAAA')).toBe(false);
		expect(passwordPolicy.validate('AAAa1AAA')).toBe(true);
	});

	it('should contain one special character', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			mustContainAtLeastOneSpecialCharacter: true,
			throwError: false,
		});

		expect(passwordPolicy.validate('a')).toBe(false);
		expect(passwordPolicy.validate('aa')).toBe(false);
		expect(passwordPolicy.validate('A')).toBe(false);
		expect(passwordPolicy.validate('   ')).toBe(false);
		expect(passwordPolicy.validate('123456')).toBe(false);
		expect(passwordPolicy.validate('AAAAA')).toBe(false);
		expect(passwordPolicy.validate('AAAaAAA')).toBe(false);
		expect(passwordPolicy.validate('AAAa1AAA')).toBe(false);
		expect(passwordPolicy.validate('AAAa@AAA')).toBe(true);
	});
});

describe('Password Policy', () => {
	describe('sendValidationMessage', () => {
		it('should return an empty array when the policy is disabled', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: false });

			expect(passwordPolicy.sendValidationMessage('password')).toEqual([]);
		});

		it.each([null, undefined, ''])('should return an empty array for invalid input: %p', (password) => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, minLength: 5, throwError: false });

			expect(passwordPolicy.sendValidationMessage(password as any)).toEqual([]);
		});

		it('should validate the minimum length rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, minLength: 5, throwError: false });

			expect(passwordPolicy.sendValidationMessage('1234')).toEqual([{ name: 'get-password-policy-minLength', isValid: false, limit: 5 }]);
			expect(passwordPolicy.sendValidationMessage('12345')).toEqual([{ name: 'get-password-policy-minLength', isValid: true, limit: 5 }]);
		});

		it('should validate the maximum length rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, maxLength: 5, throwError: false });

			expect(passwordPolicy.sendValidationMessage('123456')).toEqual([{ name: 'get-password-policy-maxLength', isValid: false, limit: 5 }]);
			expect(passwordPolicy.sendValidationMessage('12345')).toEqual([{ name: 'get-password-policy-maxLength', isValid: true, limit: 5 }]);
		});

		it('should validate the repeating characters rule', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 3,
				throwError: false,
			});

			expect(passwordPolicy.sendValidationMessage('1111')).toEqual([
				{ name: 'get-password-policy-forbidRepeatingCharactersCount', isValid: false, limit: 3 },
			]);
			expect(passwordPolicy.sendValidationMessage('1234')).toEqual([
				{ name: 'get-password-policy-forbidRepeatingCharactersCount', isValid: true, limit: 3 },
			]);
		});

		it('should validate the lowercase rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, mustContainAtLeastOneLowercase: true, throwError: false });

			expect(passwordPolicy.sendValidationMessage('ABC123')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneLowercase', isValid: false },
			]);
			expect(passwordPolicy.sendValidationMessage('abc123')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneLowercase', isValid: true },
			]);
		});

		it('should validate the uppercase rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, mustContainAtLeastOneUppercase: true, throwError: false });

			expect(passwordPolicy.sendValidationMessage('abc123')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneUppercase', isValid: false },
			]);
			expect(passwordPolicy.sendValidationMessage('Abc123')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneUppercase', isValid: true },
			]);
		});

		it('should validate the number rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, mustContainAtLeastOneNumber: true, throwError: false });

			expect(passwordPolicy.sendValidationMessage('Abcdef')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneNumber', isValid: false },
			]);
			expect(passwordPolicy.sendValidationMessage('Abcde1')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneNumber', isValid: true },
			]);
		});

		it('should validate the special character rule', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, mustContainAtLeastOneSpecialCharacter: true, throwError: false });

			expect(passwordPolicy.sendValidationMessage('Abcde1')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneSpecialCharacter', isValid: false },
			]);
			expect(passwordPolicy.sendValidationMessage('Abcde1@')).toEqual([
				{ name: 'get-password-policy-mustContainAtLeastOneSpecialCharacter', isValid: true },
			]);
		});
	});

	describe('validate with throwError enabled', () => {
		it('should throw a PasswordPolicyError with the validation details', () => {
			const passwordPolicy = new PasswordPolicy({ enabled: true, minLength: 5 });
			let thrownError: unknown;

			try {
				passwordPolicy.validate('1234');
			} catch (error) {
				thrownError = error;
			}

			expect(thrownError).toBeInstanceOf(PasswordPolicyError);
			expect(thrownError).toMatchObject({
				name: 'PasswordPolicyError',
				error: 'error-password-policy-not-met',
				message: "The password provided does not meet the server's password policy.",
				details: [
					{
						error: 'error-password-policy-not-met-minLength',
						message: 'The password does not meet the minimum length password policy.',
					},
				],
			});
		});
	});

	it('should return a correct password policy', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
			throwError: false,
			minLength: 10,
			maxLength: 20,
			forbidRepeatingCharacters: true,
			forbidRepeatingCharactersCount: 4,
			mustContainAtLeastOneLowercase: true,
			mustContainAtLeastOneUppercase: true,
			mustContainAtLeastOneNumber: true,
			mustContainAtLeastOneSpecialCharacter: true,
		});

		const policy = passwordPolicy.getPasswordPolicy();

		expect(policy).not.toBe(undefined);
		expect(policy.enabled).toBe(true);
		expect(policy.policy.length).toBe(8);
		expect(policy.policy[0][0]).toBe('get-password-policy-minLength');
		expect(policy.policy[0][1]?.minLength).toBe(10);
	});

	it('should return correct values if policy is disabled', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: false,
		});

		const policy = passwordPolicy.getPasswordPolicy();

		expect(policy.enabled).toBe(false);
		expect(policy.policy.length).toBe(0);
	});

	it('should return correct values if policy is enabled but no specifiers exists', () => {
		const passwordPolicy = new PasswordPolicy({
			enabled: true,
		});

		const policy = passwordPolicy.getPasswordPolicy();

		expect(policy.enabled).toBe(true);
		// even when no policy is specified, forbidRepeatingCharactersCount is still configured
		// since its default value is 3
		expect(policy.policy.length).toBe(1);
	});
});
