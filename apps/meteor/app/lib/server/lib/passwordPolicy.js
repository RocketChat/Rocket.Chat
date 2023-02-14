import PasswordPolicy from './PasswordPolicyClass';
import { settings } from '../../../settings/server';

export const passwordPolicy = new PasswordPolicy();

settings.watch('Accounts_Password_Policy_Enabled', (value) => {
	passwordPolicy.enabled = value;
});
settings.watch('Accounts_Password_Policy_MinLength', (value) => {
	passwordPolicy.minLength = value;
});
settings.watch('Accounts_Password_Policy_MaxLength', (value) => {
	passwordPolicy.maxLength = value;
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => {
	passwordPolicy.forbidRepeatingCharacters = value;
});
settings.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => {
	passwordPolicy.forbidRepeatingCharactersCount = value;
});
settings.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => {
	passwordPolicy.mustContainAtLeastOneLowercase = value;
});
settings.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => {
	passwordPolicy.mustContainAtLeastOneUppercase = value;
});
settings.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => {
	passwordPolicy.mustContainAtLeastOneNumber = value;
});
settings.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => {
	passwordPolicy.mustContainAtLeastOneSpecialCharacter = value;
});
