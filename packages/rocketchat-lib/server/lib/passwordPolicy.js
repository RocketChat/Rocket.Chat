import PasswordPolicy from './PasswordPolicyClass';

RocketChat.passwordPolicy = new PasswordPolicy();

RocketChat.settings.get('Accounts_Password_Policy_Enabled', (key, value) => RocketChat.passwordPolicy.enabled = value);
RocketChat.settings.get('Accounts_Password_Policy_MinLength', (key, value) => RocketChat.passwordPolicy.minLength = value);
RocketChat.settings.get('Accounts_Password_Policy_MaxLength', (key, value) => RocketChat.passwordPolicy.maxLength = value);
RocketChat.settings.get('Accounts_Password_Policy_ForbidRepeatingCharacters', (key, value) => RocketChat.passwordPolicy.forbidRepeatingCharacters = value);
RocketChat.settings.get('Accounts_Password_Policy_ForbidRepeatingCharactersCount', (key, value) => RocketChat.passwordPolicy.forbidRepeatingCharactersCount = value);
RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneLowercase', (key, value) => RocketChat.passwordPolicy.mustContainAtLeastOneLowercase = value);
RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneUppercase', (key, value) => RocketChat.passwordPolicy.mustContainAtLeastOneUppercase = value);
RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneNumber', (key, value) => RocketChat.passwordPolicy.mustContainAtLeastOneNumber = value);
RocketChat.settings.get('Accounts_Password_Policy_AtLeastOneSpecialCharacter', (key, value) => RocketChat.passwordPolicy.mustContainAtLeastOneSpecialCharacter = value);
