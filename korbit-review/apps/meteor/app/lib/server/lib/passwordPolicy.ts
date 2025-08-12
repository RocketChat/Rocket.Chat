import { PasswordPolicy } from '@rocket.chat/password-policies';

import { settings } from '../../../settings/server';

const enabled = false;
const minLength = -1;
const maxLength = -1;
const forbidRepeatingCharacters = false;
const forbidRepeatingCharactersCount = 3;
const mustContainAtLeastOneLowercase = false;
const mustContainAtLeastOneUppercase = false;
const mustContainAtLeastOneNumber = false;
const mustContainAtLeastOneSpecialCharacter = false;

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

settings.watchMultiple(
	[
		'Accounts_Password_Policy_Enabled',
		'Accounts_Password_Policy_MinLength',
		'Accounts_Password_Policy_MaxLength',
		'Accounts_Password_Policy_ForbidRepeatingCharacters',
		'Accounts_Password_Policy_ForbidRepeatingCharactersCount',
		'Accounts_Password_Policy_AtLeastOneLowercase',
		'Accounts_Password_Policy_AtLeastOneUppercase',
		'Accounts_Password_Policy_AtLeastOneNumber',
		'Accounts_Password_Policy_AtLeastOneSpecialCharacter',
	],
	([
		enabled,
		minLength,
		maxLength,
		forbidRepeatingCharacters,
		forbidRepeatingCharactersCount,
		mustContainAtLeastOneLowercase,
		mustContainAtLeastOneUppercase,
		mustContainAtLeastOneNumber,
		mustContainAtLeastOneSpecialCharacter,
	]) => {
		passwordPolicy = new PasswordPolicy({
			enabled: Boolean(enabled),
			minLength: Number(minLength),
			maxLength: Number(maxLength),
			forbidRepeatingCharacters: Boolean(forbidRepeatingCharacters),
			forbidRepeatingCharactersCount: Number(forbidRepeatingCharactersCount),
			mustContainAtLeastOneLowercase: Boolean(mustContainAtLeastOneLowercase),
			mustContainAtLeastOneUppercase: Boolean(mustContainAtLeastOneUppercase),
			mustContainAtLeastOneNumber: Boolean(mustContainAtLeastOneNumber),
			mustContainAtLeastOneSpecialCharacter: Boolean(mustContainAtLeastOneSpecialCharacter),
			throwError: true,
		});
	},
);
