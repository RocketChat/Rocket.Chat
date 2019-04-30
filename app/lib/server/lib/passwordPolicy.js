import { settings } from '../../../settings';
import PasswordPolicy from './PasswordPolicyClass';

export const passwordPolicy = new PasswordPolicy();

settings.get('Accounts_Password_Policy_Enabled', (key, value) => { passwordPolicy.enabled = value; });
settings.get('Accounts_Password_Policy_MinLength', (key, value) => { passwordPolicy.minLength = value; });
settings.get('Accounts_Password_Policy_MaxLength', (key, value) => { passwordPolicy.maxLength = value; });
settings.get('Accounts_Password_Policy_ForbidRepeatingCharacters', (key, value) => { passwordPolicy.forbidRepeatingCharacters = value; });
settings.get('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (key, value) => { passwordPolicy.forbidRepeatingCharactersCount = value; });
settings.get('Accounts_Password_Policy_AtLeastOneLowercase', (key, value) => { passwordPolicy.mustContainAtLeastOneLowercase = value; });
settings.get('Accounts_Password_Policy_AtLeastOneUppercase', (key, value) => { passwordPolicy.mustContainAtLeastOneUppercase = value; });
settings.get('Accounts_Password_Policy_AtLeastOneNumber', (key, value) => { passwordPolicy.mustContainAtLeastOneNumber = value; });
settings.get('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (key, value) => { passwordPolicy.mustContainAtLeastOneSpecialCharacter = value; });
