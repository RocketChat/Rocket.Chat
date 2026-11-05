import { describe, it } from 'node:test';

import { PasswordPolicy } from '@rocket.chat/password-policies';
import { expect } from 'chai';
import generator from 'generate-password';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const loadGeneratePassword = (policyOptions: ConstructorParameters<typeof PasswordPolicy>[0], generate?: sinon.SinonStub) => {
	const { generatePassword } = proxyquire.noCallThru().load('./generatePassword', {
		'./passwordPolicy': { passwordPolicy: new PasswordPolicy({ throwError: true, ...policyOptions }) },
		'generate-password': { __esModule: true, default: generate ? { generate } : generator },
	});

	return generatePassword as () => string;
};

describe('generatePassword', () => {
	describe('when the password policy is disabled', () => {
		it('should return a 17 character password', () => {
			const generatePassword = loadGeneratePassword({ enabled: false });

			expect(generatePassword()).to.have.length(17);
		});
	});

	describe('when the password policy is enabled', () => {
		it('should use a length of at least 12 when the minimum length is lower', () => {
			const generatePassword = loadGeneratePassword({ enabled: true, minLength: 5 });

			expect(generatePassword()).to.have.length(12);
		});

		it('should honor a minimum length greater than 12', () => {
			const generatePassword = loadGeneratePassword({ enabled: true, minLength: 20 });

			expect(generatePassword()).to.have.length(20);
		});

		it('should not exceed the maximum length', () => {
			const generatePassword = loadGeneratePassword({ enabled: true, maxLength: 8 });

			expect(generatePassword()).to.have.length(8);
		});

		it('should return a password that satisfies every character requirement', () => {
			const requirements = {
				enabled: true,
				minLength: 14,
				mustContainAtLeastOneLowercase: true,
				mustContainAtLeastOneUppercase: true,
				mustContainAtLeastOneNumber: true,
				mustContainAtLeastOneSpecialCharacter: true,
			};
			const policy = new PasswordPolicy({ ...requirements, throwError: false });
			const generatePassword = loadGeneratePassword(requirements);

			for (let i = 0; i < 50; i++) {
				expect(policy.validate(generatePassword())).to.equal(true);
			}
		});

		it('should generate another password when the first one breaks the policy', () => {
			const generate = sinon.stub();
			generate.onFirstCall().returns('aaaaaaaaaaaa');
			generate.onSecondCall().returns('abcdefghijkl');
			const generatePassword = loadGeneratePassword({ enabled: true, forbidRepeatingCharacters: true }, generate);

			expect(generatePassword()).to.equal('abcdefghijkl');
		});
	});
});
