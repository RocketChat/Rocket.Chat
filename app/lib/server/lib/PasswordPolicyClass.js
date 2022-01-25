import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

class PasswordPolicy {
	constructor({
		enabled = false,
		minLength = -1,
		maxLength = -1,
		forbidRepeatingCharacters = false,
		forbidRepeatingCharactersCount = 3, // the regex is this number minus one
		mustContainAtLeastOneLowercase = false, // /[A-Z]{3,}/ could do this instead of at least one
		mustContainAtLeastOneUppercase = false,
		mustContainAtLeastOneNumber = false,
		mustContainAtLeastOneSpecialCharacter = false,
		throwError = true,
	} = {}) {
		this.regex = {
			mustContainAtLeastOneLowercase: new RegExp('[a-z]'),
			mustContainAtLeastOneUppercase: new RegExp('[A-Z]'),
			mustContainAtLeastOneNumber: new RegExp('[0-9]'),
			mustContainAtLeastOneSpecialCharacter: new RegExp('[^A-Za-z0-9 ]'),
		};

		this.enabled = enabled;
		this.minLength = minLength;
		this.maxLength = maxLength;
		this.forbidRepeatingCharacters = forbidRepeatingCharacters;
		this.forbidRepeatingCharactersCount = forbidRepeatingCharactersCount;
		this.mustContainAtLeastOneLowercase = mustContainAtLeastOneLowercase;
		this.mustContainAtLeastOneUppercase = mustContainAtLeastOneUppercase;
		this.mustContainAtLeastOneNumber = mustContainAtLeastOneNumber;
		this.mustContainAtLeastOneSpecialCharacter = mustContainAtLeastOneSpecialCharacter;
		this.throwError = throwError;
	}

	set forbidRepeatingCharactersCount(value) {
		this._forbidRepeatingCharactersCount = value;
		this.regex.forbiddingRepeatingCharacters = new RegExp(`(.)\\1{${this.forbidRepeatingCharactersCount},}`);
	}

	get forbidRepeatingCharactersCount() {
		return this._forbidRepeatingCharactersCount;
	}

	error(error, message) {
		if (this.throwError) {
			throw new Meteor.Error(error, message);
		}

		return false;
	}

	validate(password) {
		if (typeof password !== 'string' || !password.trim().length) {
			return this.error('error-password-policy-not-met', "The password provided does not meet the server's password policy.");
		}

		if (!this.enabled) {
			return true;
		}

		if (this.minLength >= 1 && password.length < this.minLength) {
			return this.error('error-password-policy-not-met-minLength', 'The password does not meet the minimum length password policy.');
		}

		if (this.maxLength >= 1 && password.length > this.maxLength) {
			return this.error('error-password-policy-not-met-maxLength', 'The password does not meet the maximum length password policy.');
		}

		if (this.forbidRepeatingCharacters && this.regex.forbiddingRepeatingCharacters.test(password)) {
			return this.error(
				'error-password-policy-not-met-repeatingCharacters',
				'The password contains repeating characters which is against the password policy.',
			);
		}

		if (this.mustContainAtLeastOneLowercase && !this.regex.mustContainAtLeastOneLowercase.test(password)) {
			return this.error(
				'error-password-policy-not-met-oneLowercase',
				'The password does not contain at least one lowercase character which is against the password policy.',
			);
		}

		if (this.mustContainAtLeastOneUppercase && !this.regex.mustContainAtLeastOneUppercase.test(password)) {
			return this.error(
				'error-password-policy-not-met-oneUppercase',
				'The password does not contain at least one uppercase character which is against the password policy.',
			);
		}

		if (this.mustContainAtLeastOneNumber && !this.regex.mustContainAtLeastOneNumber.test(password)) {
			return this.error(
				'error-password-policy-not-met-oneNumber',
				'The password does not contain at least one numerical character which is against the password policy.',
			);
		}

		if (this.mustContainAtLeastOneSpecialCharacter && !this.regex.mustContainAtLeastOneSpecialCharacter.test(password)) {
			return this.error(
				'error-password-policy-not-met-oneSpecial',
				'The password does not contain at least one special character which is against the password policy.',
			);
		}

		return true;
	}

	getPasswordPolicy() {
		const data = {
			enabled: false,
			policy: [],
		};
		if (this.enabled) {
			data.enabled = true;
			if (this.minLength >= 1) {
				data.policy.push(['get-password-policy-minLength', { minLength: this.minLength }]);
			}
			if (this.maxLength >= 1) {
				data.policy.push(['get-password-policy-maxLength', { maxLength: this.maxLength }]);
			}
			if (this.forbidRepeatingCharacters) {
				data.policy.push(['get-password-policy-forbidRepeatingCharacters']);
			}
			if (this.forbidRepeatingCharactersCount) {
				data.policy.push([
					'get-password-policy-forbidRepeatingCharactersCount',
					{ forbidRepeatingCharactersCount: this.forbidRepeatingCharactersCount },
				]);
			}
			if (this.mustContainAtLeastOneLowercase) {
				data.policy.push(['get-password-policy-mustContainAtLeastOneLowercase']);
			}
			if (this.mustContainAtLeastOneUppercase) {
				data.policy.push(['get-password-policy-mustContainAtLeastOneUppercase']);
			}
			if (this.mustContainAtLeastOneNumber) {
				data.policy.push(['get-password-policy-mustContainAtLeastOneNumber']);
			}
			if (this.mustContainAtLeastOneSpecialCharacter) {
				data.policy.push(['get-password-policy-mustContainAtLeastOneSpecialCharacter']);
			}
		}
		return data;
	}

	generatePassword() {
		if (this.enabled) {
			for (let i = 0; i < 10; i++) {
				const password = this._generatePassword();
				if (this.validate(password)) {
					return password;
				}
			}
		}

		return Random.id();
	}

	_generatePassword() {
		const length = Math.min(Math.max(this.minLength, 12), this.maxLength > 0 ? this.maxLength : Number.MAX_SAFE_INTEGER);
		return new Array(length)
			.fill()
			.map(() => String.fromCharCode(Math.random() * 86 + 40))
			.join('');
	}
}

export default PasswordPolicy;
