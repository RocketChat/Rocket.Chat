import { PasswordPolicy } from '@rocket.chat/account-utils';

import { settings } from '../../../settings/server';

let enabled = false;
let minLength = -1;
let maxLength = -1;
let forbidRepeatingCharacters = false;
let forbidRepeatingCharactersCount = 3; // the regex is this number minus one
let mustContainAtLeastOneLowercase = false; // /[A-Z]{3,}/ could do this instead of at least one
let mustContainAtLeastOneUppercase = false;
let mustContainAtLeastOneNumber = false;
let mustContainAtLeastOneSpecialCharacter = false;

settings.watch('Accounts_Password_Policy_Enabled', (value) => {
	enabled = Boolean(value);
});
settings.watch('Accounts_Password_Policy_MinLength', (value) => {
	minLength = Number(value);
});
settings.watch('Accounts_Password_Policy_MaxLength', (value) => {
	maxLength = Number(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => {
	forbidRepeatingCharacters = Boolean(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => {
	forbidRepeatingCharactersCount = Number(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => {
	mustContainAtLeastOneLowercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => {
	mustContainAtLeastOneUppercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => {
	mustContainAtLeastOneNumber = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => {
	mustContainAtLeastOneSpecialCharacter = Boolean(value);
});

export const passwordPolicy = new PasswordPolicy({
	enabled,
	minLength,
	maxLength,
	forbidRepeatingCharacters,
	forbidRepeatingCharactersCount,
	mustContainAtLeastOneLowercase,
	mustContainAtLeastOneUppercase,
	mustContainAtLeastOneNumber,
	mustContainAtLeastOneSpecialCharacter,
	throwError: true,
});
