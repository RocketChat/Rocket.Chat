import { passwordPolicy } from '@rocket.chat/account-utils';

import { settings } from '../../../settings/server';

settings.watch('Accounts_Password_Policy_Enabled', (value) => {
	passwordPolicy.passwordPolicyEnabled = Boolean(value);
	// PasswordPolicy.PasswordPolicy.passwordPolicyEnabled = Boolean(value);
});
settings.watch('Accounts_Password_Policy_MinLength', (value) => {
	passwordPolicy.passwordMinLength = Number(value);
});
settings.watch('Accounts_Password_Policy_MaxLength', (value) => {
	passwordPolicy.passwordMaxLength = Number(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => {
	passwordPolicy.passwordForbidRepeatingCharacters = Boolean(value);
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => {
	passwordPolicy.passwordForbidRepeatingCharactersCount = Number(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => {
	passwordPolicy.passwordAtLeastOneLowercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => {
	passwordPolicy.passwordAtLeastOneUppercase = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => {
	passwordPolicy.passwordAtLeastOneNumber = Boolean(value);
});
settings.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => {
	passwordPolicy.passwordAtLeastOneSpecialCharacter = Boolean(value);
});
