"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFromDaysToMilliseconds = void 0;
const convertFromDaysToMilliseconds = (days) => {
    if (typeof days !== 'number' || !Number.isInteger(days)) {
        throw new Error('days must be a number');
    }
    return days * 24 * 60 * 60 * 1000;
};
exports.convertFromDaysToMilliseconds = convertFromDaysToMilliseconds;
//# sourceMappingURL=converter.js.map