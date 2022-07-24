import { expect } from 'chai';
import './server.mocks.js';

import PasswordPolicyClass from '../../../../app/lib/server/lib/PasswordPolicyClass';

describe('PasswordPolicyClass', () => {
	describe('Default options', () => {
		const passwordPolice = new PasswordPolicyClass();
		it('should be disabled', () => {
			expect(passwordPolice.enabled).to.be.equal(false);
		});
		it('should have minLength = -1', () => {
			expect(passwordPolice.minLength).to.be.equal(-1);
		});
		it('should have maxLength = -1', () => {
			expect(passwordPolice.maxLength).to.be.equal(-1);
		});
		it('should have forbidRepeatingCharacters = false', () => {
			expect(passwordPolice.forbidRepeatingCharacters).to.be.false;
		});
		it('should have forbidRepeatingCharactersCount = 3', () => {
			expect(passwordPolice.forbidRepeatingCharactersCount).to.be.equal(3);
		});
		it('should have mustContainAtLeastOneLowercase = false', () => {
			expect(passwordPolice.mustContainAtLeastOneLowercase).to.be.false;
		});
		it('should have mustContainAtLeastOneUppercase = false', () => {
			expect(passwordPolice.mustContainAtLeastOneUppercase).to.be.false;
		});
		it('should have mustContainAtLeastOneNumber = false', () => {
			expect(passwordPolice.mustContainAtLeastOneNumber).to.be.false;
		});
		it('should have mustContainAtLeastOneSpecialCharacter = false', () => {
			expect(passwordPolice.mustContainAtLeastOneSpecialCharacter).to.be.false;
		});

		describe('Password tests with default options', () => {
			it('should allow all passwords', () => {
				const passwordPolice = new PasswordPolicyClass({ throwError: false });
				expect(passwordPolice.validate()).to.be.equal(false);
				expect(passwordPolice.validate('')).to.be.equal(false);
				expect(passwordPolice.validate('            ')).to.be.equal(false);
				expect(passwordPolice.validate('a')).to.be.equal(true);
				expect(passwordPolice.validate('aaaaaaaaa')).to.be.equal(true);
			});
		});
	});

	describe('Password tests with options', () => {
		it('should not allow non string or empty', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				throwError: false,
			});
			expect(passwordPolice.validate()).to.be.false;
			expect(passwordPolice.validate(1)).to.be.false;
			expect(passwordPolice.validate(true)).to.be.false;
			expect(passwordPolice.validate(new Date())).to.be.false;
			expect(passwordPolice.validate(new Function())).to.be.false;
			expect(passwordPolice.validate('')).to.be.false;
		});

		it('should restrict by minLength', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				minLength: 5,
				throwError: false,
			});

			expect(passwordPolice.validate('1')).to.be.false;
			expect(passwordPolice.validate('1234')).to.be.false;
			expect(passwordPolice.validate('12345')).to.be.true;
			expect(passwordPolice.validate('     ')).to.be.false;
		});

		it('should restrict by maxLength', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				maxLength: 5,
				throwError: false,
			});

			expect(passwordPolice.validate('1')).to.be.true;
			expect(passwordPolice.validate('12345')).to.be.true;
			expect(passwordPolice.validate('123456')).to.be.false;
			expect(passwordPolice.validate('      ')).to.be.false;
		});

		it('should allow repeated characters', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: false,
				throwError: false,
			});

			expect(passwordPolice.validate('1')).to.be.true;
			expect(passwordPolice.validate('12345')).to.be.true;
			expect(passwordPolice.validate('123456')).to.be.true;
			expect(passwordPolice.validate('      ')).to.be.false;
			expect(passwordPolice.validate('11111111111111')).to.be.true;
		});

		it('should restrict repeated characters', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 3,
				throwError: false,
			});

			expect(passwordPolice.validate('1')).to.be.true;
			expect(passwordPolice.validate('11')).to.be.true;
			expect(passwordPolice.validate('111')).to.be.true;
			expect(passwordPolice.validate('1111')).to.be.false;
			expect(passwordPolice.validate('     ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.true;
		});

		it('should restrict repeated characters customized', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 5,
				throwError: false,
			});

			expect(passwordPolice.validate('1')).to.be.true;
			expect(passwordPolice.validate('11')).to.be.true;
			expect(passwordPolice.validate('111')).to.be.true;
			expect(passwordPolice.validate('1111')).to.be.true;
			expect(passwordPolice.validate('11111')).to.be.true;
			expect(passwordPolice.validate('111111')).to.be.false;
			expect(passwordPolice.validate('      ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.true;
		});

		it('should contain one lowercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneLowercase: true,
				throwError: false,
			});

			expect(passwordPolice.validate('a')).to.be.true;
			expect(passwordPolice.validate('aa')).to.be.true;
			expect(passwordPolice.validate('A')).to.be.false;
			expect(passwordPolice.validate('   ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.false;
			expect(passwordPolice.validate('AAAAA')).to.be.false;
			expect(passwordPolice.validate('AAAaAAA')).to.be.true;
		});

		it('should contain one uppercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneUppercase: true,
				throwError: false,
			});

			expect(passwordPolice.validate('a')).to.be.false;
			expect(passwordPolice.validate('aa')).to.be.false;
			expect(passwordPolice.validate('A')).to.be.true;
			expect(passwordPolice.validate('   ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.false;
			expect(passwordPolice.validate('AAAAA')).to.be.true;
			expect(passwordPolice.validate('AAAaAAA')).to.be.true;
		});

		it('should contain one number', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneNumber: true,
				throwError: false,
			});

			expect(passwordPolice.validate('a')).to.be.false;
			expect(passwordPolice.validate('aa')).to.be.false;
			expect(passwordPolice.validate('A')).to.be.false;
			expect(passwordPolice.validate('   ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.true;
			expect(passwordPolice.validate('AAAAA')).to.be.false;
			expect(passwordPolice.validate('AAAaAAA')).to.be.false;
			expect(passwordPolice.validate('AAAa1AAA')).to.be.true;
		});

		it('should contain one special character', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneSpecialCharacter: true,
				throwError: false,
			});

			expect(passwordPolice.validate('a')).to.be.false;
			expect(passwordPolice.validate('aa')).to.be.false;
			expect(passwordPolice.validate('A')).to.be.false;
			expect(passwordPolice.validate('   ')).to.be.false;
			expect(passwordPolice.validate('123456')).to.be.false;
			expect(passwordPolice.validate('AAAAA')).to.be.false;
			expect(passwordPolice.validate('AAAaAAA')).to.be.false;
			expect(passwordPolice.validate('AAAa1AAA')).to.be.false;
			expect(passwordPolice.validate('AAAa@AAA')).to.be.true;
		});
	});

	describe('Password generator', () => {
		it('should return a random password', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				throwError: false,
			});

			expect(passwordPolice.generatePassword()).to.not.be.undefined;
		});
	});

	describe('Password Policy', () => {
		it('should return a correct password policy', () => {
			const passwordPolice = new PasswordPolicyClass({
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

			const policy = passwordPolice.getPasswordPolicy();

			expect(policy).to.not.be.undefined;
			expect(policy.enabled).to.be.true;
			expect(policy.policy.length).to.be.equal(8);
			expect(policy.policy[0][0]).to.be.equal('get-password-policy-minLength');
			expect(policy.policy[0][1].minLength).to.be.equal(10);
		});

		it('should return correct values if policy is disabled', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: false,
			});

			const policy = passwordPolice.getPasswordPolicy();

			expect(policy.enabled).to.be.false;
			expect(policy.policy.length).to.be.equal(0);
		});

		it('should return correct values if policy is enabled but no specifiers exists', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
			});

			const policy = passwordPolice.getPasswordPolicy();

			expect(policy.enabled).to.be.true;
			// even when no policy is specified, forbidRepeatingCharactersCount is still configured
			// since its default value is 3
			expect(policy.policy.length).to.be.equal(1);
		});
	});
});
