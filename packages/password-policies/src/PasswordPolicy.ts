import { PasswordPolicyError } from './PasswordPolicyError';

/** Bands keyed by minimum entropy (bits) — Shannon model: length × log₂(poolSize). */
const STRENGTH_BANDS = [
	{ minEntropy: 128, score: 4 as const, label: 'very-strong' as const },
	{ minEntropy: 60, score: 3 as const, label: 'strong' as const },
	{ minEntropy: 36, score: 2 as const, label: 'fair' as const },
	{ minEntropy: 28, score: 1 as const, label: 'weak' as const },
] satisfies { minEntropy: number; score: PasswordStrengthScore; label: PasswordStrengthLabel }[];

/** Approximate pool sizes for printable ASCII character classes. */
const POOL = {
	lowercase: 26,
	uppercase: 26,
	digits: 10,
	/** Printable ASCII specials — standard estimate used by NIST SP 800-63B. */
	special: 33,
} as const;

type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4;
type PasswordStrengthLabel = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

export type PasswordStrengthResult = {
	/** Integer 0 (very-weak) → 4 (very-strong). Useful for progress bars. */
	score: PasswordStrengthScore;
	/** Human-readable label corresponding to the score. */
	label: PasswordStrengthLabel;
	/** Raw Shannon entropy in bits (poolSize = sum of present character class sizes). */
	entropy: number;
};

type PasswordPolicyMap = {
	minLength: number;
	maxLength: number;
	forbidRepeatingCharacters: boolean;
	forbidRepeatingCharactersCount: number;
	mustContainAtLeastOneLowercase: boolean;
	mustContainAtLeastOneUppercase: boolean;
	mustContainAtLeastOneNumber: boolean;
	mustContainAtLeastOneSpecialCharacter: boolean;
};

type PasswordPolicyKey = keyof PasswordPolicyMap;
type PasswordPolicyName<K extends PasswordPolicyKey> = `get-password-policy-${K}`;

type PasswordPolicyParametersEntry = {
	[K in PasswordPolicyKey]: PasswordPolicyMap[K] extends number
		? [PasswordPolicyName<K>, Record<K, PasswordPolicyMap[K]>]
		: [PasswordPolicyName<K>];
}[PasswordPolicyKey];

type PasswordPolicyType<Entry = PasswordPolicyParametersEntry> = {
	enabled: boolean;
	policy: Entry[];
};

export type PasswordPolicyOptions = Partial<
	PasswordPolicyMap & {
		enabled: boolean;
		throwError: boolean;
	}
>;

export type PasswordPolicyValidation = {
	[K in PasswordPolicyKey]: PasswordPolicyMap[K] extends number
		? { name: PasswordPolicyName<K>; limit: number }
		: { name: PasswordPolicyName<K> };
}[PasswordPolicyKey] & { isValid: boolean };

export class PasswordPolicy {
	private regex: {
		forbiddingRepeatingCharacters: RegExp;
		mustContainAtLeastOneLowercase: RegExp;
		mustContainAtLeastOneUppercase: RegExp;
		mustContainAtLeastOneNumber: RegExp;
		mustContainAtLeastOneSpecialCharacter: RegExp;
	};

	private enabled: boolean;

	private minLength: number;

	private maxLength: number;

	private forbidRepeatingCharacters: boolean;

	private mustContainAtLeastOneLowercase: boolean;

	private mustContainAtLeastOneUppercase: boolean;

	private mustContainAtLeastOneNumber: boolean;

	private mustContainAtLeastOneSpecialCharacter: boolean;

	private throwError: boolean;

	private forbidRepeatingCharactersCount: number;

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
	}: PasswordPolicyOptions) {
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

		this.regex = {
			forbiddingRepeatingCharacters: new RegExp(`(.)\\1{${forbidRepeatingCharactersCount},}`),
			mustContainAtLeastOneLowercase: new RegExp('[a-z]'),
			mustContainAtLeastOneUppercase: new RegExp('[A-Z]'),
			mustContainAtLeastOneNumber: new RegExp('[0-9]'),
			mustContainAtLeastOneSpecialCharacter: new RegExp('[^A-Za-z0-9 ]'),
		};
	}

	error(
		error: string,
		message: string,
		reasons?: {
			error: string;
			message: string;
		}[],
	) {
		if (this.throwError) {
			throw new PasswordPolicyError(message, error, reasons);
		}

		return false;
	}

	sendValidationMessage(password: string): PasswordPolicyValidation[] {
		const validationReturn: PasswordPolicyValidation[] = [];

		if (!this.enabled) {
			return [];
		}

		if (this.minLength >= 1) {
			validationReturn.push({
				name: 'get-password-policy-minLength',
				isValid: !(password.length < this.minLength),
				limit: this.minLength,
			});
		}

		if (this.maxLength >= 1) {
			validationReturn.push({
				name: 'get-password-policy-maxLength',
				isValid: !(password.length > this.maxLength),
				limit: this.maxLength,
			});
		}

		if (this.forbidRepeatingCharacters) {
			validationReturn.push({
				name: 'get-password-policy-forbidRepeatingCharactersCount',
				isValid: !this.regex.forbiddingRepeatingCharacters.test(password),
				limit: this.forbidRepeatingCharactersCount,
			});
		}

		if (this.mustContainAtLeastOneLowercase) {
			validationReturn.push({
				name: 'get-password-policy-mustContainAtLeastOneLowercase',
				isValid: this.regex.mustContainAtLeastOneLowercase.test(password),
			});
		}

		if (this.mustContainAtLeastOneUppercase) {
			validationReturn.push({
				name: 'get-password-policy-mustContainAtLeastOneUppercase',
				isValid: this.regex.mustContainAtLeastOneUppercase.test(password),
			});
		}

		if (this.mustContainAtLeastOneNumber) {
			validationReturn.push({
				name: 'get-password-policy-mustContainAtLeastOneNumber',
				isValid: this.regex.mustContainAtLeastOneNumber.test(password),
			});
		}

		if (this.mustContainAtLeastOneSpecialCharacter) {
			validationReturn.push({
				name: 'get-password-policy-mustContainAtLeastOneSpecialCharacter',
				isValid: this.regex.mustContainAtLeastOneSpecialCharacter.test(password),
			});
		}

		return validationReturn;
	}

	validate(password: string) {
		const reasons: {
			error: string;
			message: string;
		}[] = [];

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

	/**
	 * Calculates the Shannon entropy of `password` in bits.
	 *
	 * Pool size = sum of character class sizes actually present in the password:
	 * lowercase (26) + uppercase (26) + digits (10) + specials (33).
	 * Entropy = length × log₂(poolSize).
	 */
	private _calcEntropy(password: string): number {
		let poolSize = 0;
		if (/[a-z]/.test(password)) poolSize += POOL.lowercase;
		if (/[A-Z]/.test(password)) poolSize += POOL.uppercase;
		if (/[0-9]/.test(password)) poolSize += POOL.digits;
		if (/[^A-Za-z0-9]/.test(password)) poolSize += POOL.special;
		if (poolSize === 0) return 0;
		return password.length * Math.log2(poolSize);
	}

	/**
	 * Returns an entropy-based strength score for `password`, **independently of
	 * whether the password satisfies the configured policy rules**.
	 *
	 * | Score | Label       | Entropy (bits) |
	 * |-------|-------------|----------------|
	 * | 0     | very-weak   | < 28           |
	 * | 1     | weak        | 28 – 35        |
	 * | 2     | fair        | 36 – 59        |
	 * | 3     | strong      | 60 – 127       |
	 * | 4     | very-strong | ≥ 128          |
	 *
	 * Non-string or empty input always returns `score: 0`.
	 */
	getStrengthScore(password: string): PasswordStrengthResult {
		if (typeof password !== 'string' || password.length === 0) {
			return { score: 0, label: 'very-weak', entropy: 0 };
		}

		const entropy = this._calcEntropy(password);

		for (const band of STRENGTH_BANDS) {
			if (entropy >= band.minEntropy) {
				return { score: band.score, label: band.label, entropy };
			}
		}

		return { score: 0, label: 'very-weak', entropy };
	}

	getPasswordPolicy(): PasswordPolicyType<[name: string, params?: Record<string, number | boolean>]> {
		const data: PasswordPolicyType = {
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
}
