import { PasswordPolicy } from '@rocket.chat/password-policies';

import { settings } from '../../../settings/server';

let enabled = false;
let minLength = -1;
let maxLength = -1;
let forbidRepeatingCharacters = false;
let forbidRepeatingCharactersCount = 3;
let mustContainAtLeastOneLowercase = false;
let mustContainAtLeastOneUppercase = false;
let mustContainAtLeastOneNumber = false;
let mustContainAtLeastOneSpecialCharacter = false;

export let passwordPolicy = new PasswordPolicy({
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

settings.watch('Accounts_Password_Policy_Enabled', (value) => {
	enabled = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_MinLength', (value) => {
	minLength = Number(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_MaxLength', (value) => {
	maxLength = Number(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => {
	forbidRepeatingCharacters = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => {
	forbidRepeatingCharactersCount = Number(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => {
	mustContainAtLeastOneLowercase = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => {
	mustContainAtLeastOneUppercase = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => {
	mustContainAtLeastOneNumber = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
settings.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => {
	mustContainAtLeastOneSpecialCharacter = Boolean(value);
	passwordPolicy = new PasswordPolicy({
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
});
