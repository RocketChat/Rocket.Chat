import PasswordPolicy from './PasswordPolicyClass';

const passwordPolicy = new PasswordPolicy({
	enabled: false,
	minLength: -1,
	maxLength: -1,
	forbidRepeatingCharacters: false,
	forbidRepeatingCharactersCount: 3, // the regex is this number minus one
	mustContainAtLeastOneLowercase: false, // /[A-Z]{3,}/ could do this instead of at least one
	mustContainAtLeastOneUppercase: false,
	mustContainAtLeastOneNumber: false,
	mustContainAtLeastOneSpecialCharacter: false,
	throwError: true,
});

export default passwordPolicy;
