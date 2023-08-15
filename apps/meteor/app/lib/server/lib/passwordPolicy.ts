import { PasswordPolicy } from '@rocket.chat/account-utils';

import { settings } from '../../../settings/server';

export const passwordPolicy = new PasswordPolicy({
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

settings.watch('Accounts_Password_Policy_Enabled', (value) => {
	passwordPolicy.enabled = Boolean(value);
});
settings.watch('Accounts_Password_Policy_MinLength', (value) => {
	passwordPolicy.minLength = Number(value);
});
settings.watch('Accounts_Password_Policy_MaxLength', (value) => {
	passwordPolicy.maxLength = Number(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => {
	passwordPolicy.forbidRepeatingCharacters = Boolean(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => {
	passwordPolicy.forbidRepeatingCharactersCount = Number(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => {
	passwordPolicy.mustContainAtLeastOneLowercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => {
	passwordPolicy.mustContainAtLeastOneUppercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => {
	passwordPolicy.mustContainAtLeastOneNumber = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => {
	passwordPolicy.mustContainAtLeastOneSpecialCharacter = Boolean(value);
});
