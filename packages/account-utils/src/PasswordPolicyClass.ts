import { Random } from '@rocket.chat/random';
import generator from 'generate-password';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { MeteorError } from '@rocket.chat/core-services';

class PasswordPolicy {
	regex: {
		forbiddingRepeatingCharacters: RegExp;
		mustContainAtLeastOneLowercase: RegExp;
		mustContainAtLeastOneUppercase: RegExp;
		mustContainAtLeastOneNumber: RegExp;
		mustContainAtLeastOneSpecialCharacter: RegExp;
	};

	enabled: boolean;

	minLength: number;

	maxLength: number;

	forbidRepeatingCharacters: boolean;

	mustContainAtLeastOneLowercase: boolean;

	mustContainAtLeastOneUppercase: boolean;

	mustContainAtLeastOneNumber: boolean;

	mustContainAtLeastOneSpecialCharacter: boolean;

	throwError: boolean;

	private _forbidRepeatingCharactersCount: number | undefined;

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
	}: {
		enabled: boolean;
		minLength: number;
		maxLength: number;
		forbidRepeatingCharacters: boolean;
		forbidRepeatingCharactersCount: number;
		mustContainAtLeastOneLowercase: boolean;
		mustContainAtLeastOneUppercase: boolean;
		mustContainAtLeastOneNumber: boolean;
		mustContainAtLeastOneSpecialCharacter: boolean;
		throwError: boolean;
	}) {
		this.regex = {
			forbiddingRepeatingCharacters: new RegExp('.*'), // match everything (with no line breaks) by default
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

	error(
		error: string | number,
		message: string | undefined,
		reasons?: {
			error: string;
			message: string;
		}[],
	) {
		if (this.throwError) {
			throw new MeteorError(error, message, reasons);
		}

		return false;
	}

	sendErrorMessage(password: string) {
		type validationMessage = {
			message: Record<
				string,
				{
					isValid: boolean;
					limit?: number | undefined;
				}
			>;
		};

		const validationReturn: validationMessage[] = [];

		if (!this.enabled) {
			return true;
		}

		if (this.minLength >= 1 && (password as string).length < this.minLength) {
			validationReturn.push({
				message: {
					'get-password-policy-minLength': {
						isValid: false,
						limit: this.minLength,
					},
				},
			});
		}

		if (this.maxLength >= 1 && (password as string).length > this.maxLength) {
			validationReturn.push({
				message: {
					'get-password-policy-maxLength': {
						isValid: false,
						limit: this.maxLength,
					},
				},
			});
		}

		if (this.forbidRepeatingCharacters && this.regex.forbiddingRepeatingCharacters.test(password as string)) {
			validationReturn.push({
				message: {
					'get-password-policy-forbidRepeatingCharactersCount': {
						isValid: false,
						limit: this.forbidRepeatingCharactersCount,
					},
				},
			});
		}

		if (this.mustContainAtLeastOneLowercase && !this.regex.mustContainAtLeastOneLowercase.test(password as string)) {
			validationReturn.push({
				message: {
					'get-password-policy-mustContainAtLeastOneLowercase': {
						isValid: false,
					},
				},
			});
		}

		if (this.mustContainAtLeastOneUppercase && !this.regex.mustContainAtLeastOneUppercase.test(password as string)) {
			validationReturn.push({
				message: {
					'get-password-policy-mustContainAtLeastOneUppercase': {
						isValid: false,
					},
				},
			});
		}

		if (this.mustContainAtLeastOneNumber && !this.regex.mustContainAtLeastOneNumber.test(password as string)) {
			validationReturn.push({
				message: {
					'get-password-policy-mustContainAtLeastOneNumber': {
						isValid: false,
					},
				},
			});
		}

		if (this.mustContainAtLeastOneSpecialCharacter && !this.regex.mustContainAtLeastOneSpecialCharacter.test(password as string)) {
			validationReturn.push({
				message: {
					'get-password-policy-mustContainAtLeastOneSpecialCharacter': {
						isValid: false,
					},
				},
			});
		}

		if (validationReturn.length !== 0) {
			return validationReturn;
		}
		return true;
	}

	validate(password: string | unknown) {
		const reasons = [];
		if (typeof password !== 'string' || !password.trim().length) {
			return this.error('error-password-policy-not-met', "The password provided does not meet the server's password policy.");
		}

		if (!this.enabled) {
			return true;
		}

		if (this.minLength >= 1 && password.length < this.minLength) {
			reasons.push({
				error: 'error-password-policy-not-met-minLength',
				message: 'The password does not meet the minimum length password policy.',
			});
		}

		if (this.maxLength >= 1 && password.length > this.maxLength) {
			reasons.push({
				error: 'error-password-policy-not-met-maxLength',
				message: 'The password does not meet the maximum length password policy.',
			});
		}

		if (this.forbidRepeatingCharacters && this.regex.forbiddingRepeatingCharacters.test(password)) {
			reasons.push({
				error: 'error-password-policy-not-met-repeatingCharacters',
				message: 'The password contains repeating characters which is against the password policy.',
			});
		}

		if (this.mustContainAtLeastOneLowercase && !this.regex.mustContainAtLeastOneLowercase.test(password)) {
			reasons.push({
				error: 'error-password-policy-not-met-oneLowercase',
				message: 'The password does not contain at least one lowercase character which is against the password policy.',
			});
		}

		if (this.mustContainAtLeastOneUppercase && !this.regex.mustContainAtLeastOneUppercase.test(password)) {
			reasons.push({
				error: 'error-password-policy-not-met-oneUppercase',
				message: 'The password does not contain at least one uppercase character which is against the password policy.',
			});
		}

		if (this.mustContainAtLeastOneNumber && !this.regex.mustContainAtLeastOneNumber.test(password)) {
			reasons.push({
				error: 'error-password-policy-not-met-oneNumber',
				message: 'The password does not contain at least one numerical character which is against the password policy.',
			});
		}

		if (this.mustContainAtLeastOneSpecialCharacter && !this.regex.mustContainAtLeastOneSpecialCharacter.test(password)) {
			reasons.push({
				error: 'error-password-policy-not-met-oneSpecial',
				message: 'The password does not contain at least one special character which is against the password policy.',
			});
		}

		if (reasons.length) {
			return this.error('error-password-policy-not-met', `The password provided does not meet the server's password policy.`, reasons);
		}

		return true;
	}

	getPasswordPolicy() {
		type dataType = {
			enabled: boolean;
			policy: [TranslationKey, { [key: string]: number }?][];
		};

		const data: dataType = {
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
		return generator.generate({
			length,
			...(this.mustContainAtLeastOneNumber && { numbers: true }),
			...(this.mustContainAtLeastOneSpecialCharacter && { symbols: true }),
			...(this.mustContainAtLeastOneLowercase && { lowercase: true }),
			...(this.mustContainAtLeastOneUppercase && { uppercase: true }),
			strict: true,
		});
	}
}

export default PasswordPolicy;
