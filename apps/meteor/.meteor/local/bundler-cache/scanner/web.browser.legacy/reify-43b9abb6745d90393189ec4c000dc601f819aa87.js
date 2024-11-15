"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLoginExpirationInMs = exports.getLoginExpirationInDays = void 0;
const converter_1 = require("./converter");
const ACCOUNTS_DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
// Given a value, validates if it mets the conditions to be a valid login expiration.
// Else, returns the default login expiration (which for Meteor is 90 days)
const getLoginExpirationInDays = (expiry) => {
    if (expiry && typeof expiry === 'number' && !Number.isNaN(expiry) && expiry > 0) {
        return expiry;
    }
    return ACCOUNTS_DEFAULT_LOGIN_EXPIRATION_DAYS;
};
exports.getLoginExpirationInDays = getLoginExpirationInDays;
const getLoginExpirationInMs = (expiry) => {
    return (0, converter_1.convertFromDaysToMilliseconds)((0, exports.getLoginExpirationInDays)(expiry));
};
exports.getLoginExpirationInMs = getLoginExpirationInMs;
//# sourceMappingURL=getLoginExpiration.js.map