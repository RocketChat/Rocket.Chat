/* eslint-env mocha */
import 'babel-polyfill';
import assert from 'assert';
import './server.mocks.js';

import PasswordPolicyClass from '../server/lib/PasswordPolicyClass';

describe('PasswordPolicyClass', () => {
	describe('Default options', () => {
		const passwordPolice = new PasswordPolicyClass();
		it('should be disabled', () => {
			assert.equal(passwordPolice.enabled, false);
		});
		it('should have minLength = -1', () => {
			assert.equal(passwordPolice.minLength, -1);
		});
		it('should have maxLength = -1', () => {
			assert.equal(passwordPolice.maxLength, -1);
		});
		it('should have forbidRepeatingCharacters = false', () => {
			assert.equal(passwordPolice.forbidRepeatingCharacters, false);
		});
		it('should have forbidRepeatingCharactersCount = 3', () => {
			assert.equal(passwordPolice.forbidRepeatingCharactersCount, 3);
		});
		it('should have mustContainAtLeastOneLowercase = false', () => {
			assert.equal(passwordPolice.mustContainAtLeastOneLowercase, false);
		});
		it('should have mustContainAtLeastOneUppercase = false', () => {
			assert.equal(passwordPolice.mustContainAtLeastOneUppercase, false);
		});
		it('should have mustContainAtLeastOneNumber = false', () => {
			assert.equal(passwordPolice.mustContainAtLeastOneNumber, false);
		});
		it('should have mustContainAtLeastOneSpecialCharacter = false', () => {
			assert.equal(passwordPolice.mustContainAtLeastOneSpecialCharacter, false);
		});

		describe('Password tests with default options', () => {
			it('should allow all passwords', () => {
				const passwordPolice = new PasswordPolicyClass();
				assert.equal(passwordPolice.validate(), true);
				assert.equal(passwordPolice.validate(''), true);
				assert.equal(passwordPolice.validate('a'), true);
				assert.equal(passwordPolice.validate('aaaaaaaaa'), true);
				assert.equal(passwordPolice.validate('            '), true);
			});
		});
	});

	describe('Password tests with options', () => {
		it('should not allow non string or empty', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				throwError: false,
			});

			assert.equal(passwordPolice.validate(), false);
			assert.equal(passwordPolice.validate(1), false);
			assert.equal(passwordPolice.validate(true), false);
			assert.equal(passwordPolice.validate(new Date()), false);
			assert.equal(passwordPolice.validate(new Function()), false);
			assert.equal(passwordPolice.validate(''), false);
		});

		it('should restrict by minLength', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				minLength: 5,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('1'), false);
			assert.equal(passwordPolice.validate('1234'), false);
			assert.equal(passwordPolice.validate('12345'), true);
			assert.equal(passwordPolice.validate('     '), true);
		});

		it('should restrict by maxLength', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				maxLength: 5,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('1'), true);
			assert.equal(passwordPolice.validate('12345'), true);
			assert.equal(passwordPolice.validate('123456'), false);
			assert.equal(passwordPolice.validate('      '), false);
		});

		it('should allow repeated characters', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: false,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('1'), true);
			assert.equal(passwordPolice.validate('12345'), true);
			assert.equal(passwordPolice.validate('123456'), true);
			assert.equal(passwordPolice.validate('      '), true);
			assert.equal(passwordPolice.validate('11111111111111'), true);
		});

		it('should restrict repeated characters', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 3,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('1'), true);
			assert.equal(passwordPolice.validate('11'), true);
			assert.equal(passwordPolice.validate('111'), true);
			assert.equal(passwordPolice.validate('1111'), false);
			assert.equal(passwordPolice.validate('     '), false);
			assert.equal(passwordPolice.validate('123456'), true);
		});

		it('should restrict repeated characters customized', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				forbidRepeatingCharacters: true,
				forbidRepeatingCharactersCount: 5,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('1'), true);
			assert.equal(passwordPolice.validate('11'), true);
			assert.equal(passwordPolice.validate('111'), true);
			assert.equal(passwordPolice.validate('1111'), true);
			assert.equal(passwordPolice.validate('11111'), true);
			assert.equal(passwordPolice.validate('111111'), false);
			assert.equal(passwordPolice.validate('      '), false);
			assert.equal(passwordPolice.validate('123456'), true);
		});

		it('should contain one lowercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneLowercase: true,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('a'), true);
			assert.equal(passwordPolice.validate('aa'), true);
			assert.equal(passwordPolice.validate('A'), false);
			assert.equal(passwordPolice.validate('   '), false);
			assert.equal(passwordPolice.validate('123456'), false);
			assert.equal(passwordPolice.validate('AAAAA'), false);
			assert.equal(passwordPolice.validate('AAAaAAA'), true);
		});

		it('should contain one uppercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneUppercase: true,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('a'), false);
			assert.equal(passwordPolice.validate('aa'), false);
			assert.equal(passwordPolice.validate('A'), true);
			assert.equal(passwordPolice.validate('   '), false);
			assert.equal(passwordPolice.validate('123456'), false);
			assert.equal(passwordPolice.validate('AAAAA'), true);
			assert.equal(passwordPolice.validate('AAAaAAA'), true);
		});

		it('should contain one uppercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneNumber: true,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('a'), false);
			assert.equal(passwordPolice.validate('aa'), false);
			assert.equal(passwordPolice.validate('A'), false);
			assert.equal(passwordPolice.validate('   '), false);
			assert.equal(passwordPolice.validate('123456'), true);
			assert.equal(passwordPolice.validate('AAAAA'), false);
			assert.equal(passwordPolice.validate('AAAaAAA'), false);
			assert.equal(passwordPolice.validate('AAAa1AAA'), true);
		});

		it('should contain one uppercase', () => {
			const passwordPolice = new PasswordPolicyClass({
				enabled: true,
				mustContainAtLeastOneSpecialCharacter: true,
				throwError: false,
			});

			assert.equal(passwordPolice.validate('a'), false);
			assert.equal(passwordPolice.validate('aa'), false);
			assert.equal(passwordPolice.validate('A'), false);
			assert.equal(passwordPolice.validate('   '), false);
			assert.equal(passwordPolice.validate('123456'), false);
			assert.equal(passwordPolice.validate('AAAAA'), false);
			assert.equal(passwordPolice.validate('AAAaAAA'), false);
			assert.equal(passwordPolice.validate('AAAa1AAA'), false);
			assert.equal(passwordPolice.validate('AAAa@AAA'), true);
		});
	});
});
