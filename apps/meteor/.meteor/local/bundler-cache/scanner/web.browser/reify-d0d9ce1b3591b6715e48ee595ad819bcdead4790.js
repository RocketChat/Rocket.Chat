"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVerifyPassword = void 0;
const password_policies_1 = require("@rocket.chat/password-policies");
const react_1 = require("react");
const useSetting_1 = require("./useSetting");
const useVerifyPassword = (password) => {
    const enabled = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_Enabled'));
    const minLength = Number((0, useSetting_1.useSetting)('Accounts_Password_Policy_MinLength'));
    const maxLength = Number((0, useSetting_1.useSetting)('Accounts_Password_Policy_MaxLength'));
    const forbidRepeatingCharacters = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_ForbidRepeatingCharacters'));
    const forbidRepeatingCharactersCount = Number((0, useSetting_1.useSetting)('Accounts_Password_Policy_ForbidRepeatingCharactersCount'));
    const mustContainAtLeastOneLowercase = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneLowercase'));
    const mustContainAtLeastOneUppercase = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneUppercase'));
    const mustContainAtLeastOneNumber = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneNumber'));
    const mustContainAtLeastOneSpecialCharacter = Boolean((0, useSetting_1.useSetting)('Accounts_Password_Policy_AtLeastOneSpecialCharacter'));
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