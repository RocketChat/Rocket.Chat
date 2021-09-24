import PasswordPolicy from './PasswordPolicyClass';
import { SettingsVersion4 } from '../../../settings';

export const passwordPolicy = new PasswordPolicy();

SettingsVersion4.watch('Accounts_Password_Policy_Enabled', (value) => { passwordPolicy.enabled = value; });
SettingsVersion4.watch('Accounts_Password_Policy_MinLength', (value) => { passwordPolicy.minLength = value; });
SettingsVersion4.watch('Accounts_Password_Policy_MaxLength', (value) => { passwordPolicy.maxLength = value; });
SettingsVersion4.watch('Accounts_Password_Policy_ForbidRepeatingCharacters', (value) => { passwordPolicy.forbidRepeatingCharacters = value; });
SettingsVersion4.watch('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (value) => { passwordPolicy.forbidRepeatingCharactersCount = value; });
SettingsVersion4.watch('Accounts_Password_Policy_AtLeastOneLowercase', (value) => { passwordPolicy.mustContainAtLeastOneLowercase = value; });
SettingsVersion4.watch('Accounts_Password_Policy_AtLeastOneUppercase', (value) => { passwordPolicy.mustContainAtLeastOneUppercase = value; });
SettingsVersion4.watch('Accounts_Password_Policy_AtLeastOneNumber', (value) => { passwordPolicy.mustContainAtLeastOneNumber = value; });
SettingsVersion4.watch('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (value) => { passwordPolicy.mustContainAtLeastOneSpecialCharacter = value; });
