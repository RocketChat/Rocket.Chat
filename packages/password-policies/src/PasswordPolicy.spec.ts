import { PasswordPolicy } from './PasswordPolicy';

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

describe('getStrengthScore', () => {
	// A single policy instance is sufficient — getStrengthScore is policy-config-independent.
	const policy = new PasswordPolicy({});

	it('should return score 0 / very-weak with zero entropy for an empty string', () => {
		const result = policy.getStrengthScore('');
		expect(result.score).toBe(0);
		expect(result.label).toBe('very-weak');
		expect(result.entropy).toBe(0);
	});

	it('should return score 0 / very-weak for non-string input', () => {
		const result = policy.getStrengthScore(null as any);
		expect(result.score).toBe(0);
		expect(result.label).toBe('very-weak');
		expect(result.entropy).toBe(0);
	});

	it('should return score 0 (very-weak) for a 5-char lowercase-only password — ~23.5 bits', () => {
		// pool = 26, entropy = 5 * log2(26) ≈ 23.5 bits  →  < 28 threshold
		const result = policy.getStrengthScore('abcde');
		expect(result.score).toBe(0);
		expect(result.label).toBe('very-weak');
		expect(result.entropy).toBeGreaterThan(0);
	});

	it('should return score 1 (weak) for a 6-char lowercase-only password — ~28.2 bits', () => {
		// pool = 26, entropy = 6 * log2(26) ≈ 28.2 bits  →  [28, 36)
		const result = policy.getStrengthScore('abcdef');
		expect(result.score).toBe(1);
		expect(result.label).toBe('weak');
	});

	it('should return score 1 (weak) for a 5-char all-class password — ~32.8 bits', () => {
		// pool = 26+26+10+33 = 95, entropy = 5 * log2(95) ≈ 32.8 bits  →  [28, 36)
		const result = policy.getStrengthScore('Abc1!');
		expect(result.score).toBe(1);
		expect(result.label).toBe('weak');
	});

	it('should return score 2 (fair) for an 8-char lowercase-only password — ~37.6 bits', () => {
		// pool = 26, entropy = 8 * log2(26) ≈ 37.6 bits  →  [36, 60)
		const result = policy.getStrengthScore('abcdefgh');
		expect(result.score).toBe(2);
		expect(result.label).toBe('fair');
	});

	it('should return score 3 (strong) for a 13-char lowercase-only password — ~61.1 bits', () => {
		// pool = 26, entropy = 13 * log2(26) ≈ 61.1 bits  →  [60, 128)
		const result = policy.getStrengthScore('abcdefghijklm');
		expect(result.score).toBe(3);
		expect(result.label).toBe('strong');
	});

	it('should return score 3 (strong) for a 10-char all-class password — ~65.7 bits', () => {
		// pool = 95, entropy = 10 * log2(95) ≈ 65.7 bits  →  [60, 128)
		const result = policy.getStrengthScore('Abcdef12!@');
		expect(result.score).toBe(3);
		expect(result.label).toBe('strong');
	});

	it('should return score 4 (very-strong) for a 20-char all-class password — ~131.4 bits', () => {
		// pool = 95, entropy = 20 * log2(95) ≈ 131.4 bits  →  ≥ 128
		const result = policy.getStrengthScore('AbCdEf1!AbCdEf1!AbCd');
		expect(result.score).toBe(4);
		expect(result.label).toBe('very-strong');
	});

	it('should expose a positive numeric entropy value for any non-empty password', () => {
		const result = policy.getStrengthScore('hello');
		expect(typeof result.entropy).toBe('number');
		expect(result.entropy).toBeGreaterThan(0);
	});
});
