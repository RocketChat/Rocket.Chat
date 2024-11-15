"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isServiceData = void 0;
const isServiceData = (data) => {
    if (typeof data !== 'object' || data === null) {
        return false;
    }
    const { from, to, body } = data;
    return typeof from === 'string' && typeof to === 'string' && typeof body === 'string';
};
exports.isServiceData = isServiceData;
//# sourceMappingURL=sms.js.map