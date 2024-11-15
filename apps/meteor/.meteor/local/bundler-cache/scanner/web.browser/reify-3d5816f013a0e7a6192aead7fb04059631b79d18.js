"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUserFederated = exports.isRegisterUser = exports.isOAuthUser = exports.isCustomOAuthUser = exports.isDefaultOAuthUser = exports.isUserServiceKey = void 0;
const defaultOAuthKeys = [
    'google',
    'dolphin',
    'facebook',
    'github',
    'gitlab',
    'google',
    'ldap',
    'linkedin',
    'nextcloud',
    'saml',
    'twitter',
];
const userServiceKeys = ['emailCode', 'email2fa', 'totp', 'resume', 'password', 'passwordHistory', 'cloud', 'email'];
const isUserServiceKey = (key) => userServiceKeys.includes(key) || defaultOAuthKeys.includes(key);
exports.isUserServiceKey = isUserServiceKey;
const isDefaultOAuthUser = (user) => !!user.services && Object.keys(user.services).some((key) => defaultOAuthKeys.includes(key));
exports.isDefaultOAuthUser = isDefaultOAuthUser;
const isCustomOAuthUser = (user) => !!user.services && Object.keys(user.services).some((key) => !(0, exports.isUserServiceKey)(key));
exports.isCustomOAuthUser = isCustomOAuthUser;
const isOAuthUser = (user) => (0, exports.isDefaultOAuthUser)(user) || (0, exports.isCustomOAuthUser)(user);
exports.isOAuthUser = isOAuthUser;
const isRegisterUser = (user) => user.username !== undefined && user.name !== undefined;
exports.isRegisterUser = isRegisterUser;
const isUserFederated = (user) => 'federated' in user && user.federated === true;
exports.isUserFederated = isUserFederated;
//# sourceMappingURL=IUser.js.map