"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVerifyPassword = void 0;
const password_policies_1 = require("@rocket.chat/password-policies");
const react_1 = require("react");
const useSetting_1 = require("./useSetting");
const useVerifyPassword = (password) => {
    const enabled = (0, useSetting_1.useSetting)('Accounts_Password_Policy_Enabled', false);
    const minLength = (0, useSetting_1.useSetting)('Accounts_Password_Policy_MinLength', 7);
    const maxLength = (0, useSetting_1.useSetting)('Accounts_Password_Policy_MaxLength', -1);
    const forbidRepeatingCharacters = (0, useSetting_1.useSetting)('Accounts_Password_Policy_ForbidRepeatingCharacters', true);
    const forbidRepeatingCharactersCount = (0, useSetting_1.useSetting)('Accounts_Password_Policy_ForbidRepeatingCharactersCount', 3);
    const mustContainAtLeastOneLowercase = (0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneLowercase', true);
    const mustContainAtLeastOneUppercase = (0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneUppercase', true);
    const mustContainAtLeastOneNumber = (0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneNumber', true);
    const mustContainAtLeastOneSpecialCharacter = (0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneSpecialCharacter', true);
    const validator = (0, react_1.useMemo)(() => new password_policies_1.PasswordPolicy({
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
    }), [
        enabled,
        minLength,
        maxLength,
        forbidRepeatingCharacters,
        forbidRepeatingCharactersCount,
        mustContainAtLeastOneLowercase,
        mustContainAtLeastOneUppercase,
        mustContainAtLeastOneNumber,
        mustContainAtLeastOneSpecialCharacter,
    ]);
    return (0, react_1.useMemo)(() => validator.sendValidationMessage(password || ''), [password, validator]);
};
exports.useVerifyPassword = useVerifyPassword;
//# sourceMappingURL=useVerifyPassword.js.map