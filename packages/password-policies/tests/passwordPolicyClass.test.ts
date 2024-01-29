import { expect } from 'chai';

import { PasswordPolicy } from '../src/PasswordPolicyClass';

describe('PasswordPolicy', () => {
	describe('Password tests with default options', () => {
		it('should allow all passwords', () => {
			const passwordPolicy = new PasswordPolicy({ throwError: false });
			expect(passwordPolicy.validate(null as any)).to.be.equal(false);
			expect(passwordPolicy.validate(undefined as any)).to.be.equal(false);
			expect(passwordPolicy.validate('')).to.be.equal(false);
			expect(passwordPolicy.validate('            ')).to.be.equal(false);
			expect(passwordPolicy.validate('a')).to.be.equal(true);
			expect(passwordPolicy.validate('aaaaaaaaa')).to.be.equal(true);
		});
	});

	describe('Password tests with options', () => {
		it('should not allow non string or empty', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				throwError: false,
			});
			expect(passwordPolicy.validate(null as any)).to.be.equal(false);
			expect(passwordPolicy.validate(undefined as any)).to.be.false;
			expect(passwordPolicy.validate(1 as any)).to.be.false;
			expect(passwordPolicy.validate(true as any)).to.be.false;
			expect(passwordPolicy.validate(new Date() as any)).to.be.false;
			expect(passwordPolicy.validate(new Function() as any)).to.be.false;
			expect(passwordPolicy.validate('')).to.be.false;
		});

		it('should restrict by minLength', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				minLength: 5,
				throwError: false,
			});

			expect(passwordPolicy.validate('1')).to.be.false;
			expect(passwordPolicy.validate('1234')).to.be.false;
			expect(passwordPolicy.validate('12345')).to.be.true;
			expect(passwordPolicy.validate('     ')).to.be.false;
		});

		it('should restrict by maxLength', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				maxLength: 5,
				throwError: false,
			});

			expect(passwordPolicy.validate('1')).to.be.true;
			expect(passwordPolicy.validate('12345')).to.be.true;
			expect(passwordPolicy.validate('123456')).to.be.false;
			expect(passwordPolicy.validate('      ')).to.be.false;
		});

		it('should allow repeated characters', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				forbidRepeatingCharacters: false,
				throwError: false,
			});

			expect(passwordPolicy.validate('1')).to.be.true;
			expect(passwordPolicy.validate('12345')).to.be.true;
			expect(passwordPolicy.validate('123456')).to.be.true;
			expect(passwordPolicy.validate('      ')).to.be.false;
			expect(passwordPolicy.validate('11111111111111')).to.be.true;
		});

		it('should restrict repeated characters', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 3,
				throwError: false,
			});

			expect(passwordPolicy.validate('1')).to.be.true;
			expect(passwordPolicy.validate('11')).to.be.true;
			expect(passwordPolicy.validate('111')).to.be.true;
			expect(passwordPolicy.validate('1111')).to.be.false;
			expect(passwordPolicy.validate('     ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.true;
		});

		it('should restrict repeated characters customized', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 5,
				throwError: false,
			});

			expect(passwordPolicy.validate('1')).to.be.true;
			expect(passwordPolicy.validate('11')).to.be.true;
			expect(passwordPolicy.validate('111')).to.be.true;
			expect(passwordPolicy.validate('1111')).to.be.true;
			expect(passwordPolicy.validate('11111')).to.be.true;
			expect(passwordPolicy.validate('111111')).to.be.false;
			expect(passwordPolicy.validate('      ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.true;
		});

		it('should contain one lowercase', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				mustContainAtLeastOneLowercase: true,
				throwError: false,
			});

			expect(passwordPolicy.validate('a')).to.be.true;
			expect(passwordPolicy.validate('aa')).to.be.true;
			expect(passwordPolicy.validate('A')).to.be.false;
			expect(passwordPolicy.validate('   ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.false;
			expect(passwordPolicy.validate('AAAAA')).to.be.false;
			expect(passwordPolicy.validate('AAAaAAA')).to.be.true;
		});

		it('should contain one uppercase', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				mustContainAtLeastOneUppercase: true,
				throwError: false,
			});

			expect(passwordPolicy.validate('a')).to.be.false;
			expect(passwordPolicy.validate('aa')).to.be.false;
			expect(passwordPolicy.validate('A')).to.be.true;
			expect(passwordPolicy.validate('   ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.false;
			expect(passwordPolicy.validate('AAAAA')).to.be.true;
			expect(passwordPolicy.validate('AAAaAAA')).to.be.true;
		});

		it('should contain one number', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				mustContainAtLeastOneNumber: true,
				throwError: false,
			});

			expect(passwordPolicy.validate('a')).to.be.false;
			expect(passwordPolicy.validate('aa')).to.be.false;
			expect(passwordPolicy.validate('A')).to.be.false;
			expect(passwordPolicy.validate('   ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.true;
			expect(passwordPolicy.validate('AAAAA')).to.be.false;
			expect(passwordPolicy.validate('AAAaAAA')).to.be.false;
			expect(passwordPolicy.validate('AAAa1AAA')).to.be.true;
		});

		it('should contain one special character', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
				mustContainAtLeastOneSpecialCharacter: true,
				throwError: false,
			});

			expect(passwordPolicy.validate('a')).to.be.false;
			expect(passwordPolicy.validate('aa')).to.be.false;
			expect(passwordPolicy.validate('A')).to.be.false;
			expect(passwordPolicy.validate('   ')).to.be.false;
			expect(passwordPolicy.validate('123456')).to.be.false;
			expect(passwordPolicy.validate('AAAAA')).to.be.false;
			expect(passwordPolicy.validate('AAAaAAA')).to.be.false;
			expect(passwordPolicy.validate('AAAa1AAA')).to.be.false;
			expect(passwordPolicy.validate('AAAa@AAA')).to.be.true;
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

			expect(policy).to.not.be.undefined;
			expect(policy.enabled).to.be.true;
			expect(policy.policy.length).to.be.equal(8);
			expect(policy.policy[0][0]).to.be.equal('get-password-policy-minLength');
			expect(policy.policy[0][1]?.minLength).to.be.equal(10);
		});

		it('should return correct values if policy is disabled', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: false,
			});

			const policy = passwordPolicy.getPasswordPolicy();

			expect(policy.enabled).to.be.false;
			expect(policy.policy.length).to.be.equal(0);
		});

		it('should return correct values if policy is enabled but no specifiers exists', () => {
			const passwordPolicy = new PasswordPolicy({
				enabled: true,
			});

			const policy = passwordPolicy.getPasswordPolicy();

			expect(policy.enabled).to.be.true;
			// even when no policy is specified, forbidRepeatingCharactersCount is still configured
			// since its default value is 3
			expect(policy.policy.length).to.be.equal(1);
		});
	});
});
