"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utilities = void 0;
const cloneDeep = require("lodash.clonedeep");
class Utilities {
    static deepClone(item) {
        return cloneDeep(item);
    }
    static deepFreeze(item) {
        Object.freeze(item);
        Object.getOwnPropertyNames(item).forEach((prop) => {
            if (item.hasOwnProperty(prop) &&
                item[prop] !== null &&
                (typeof item[prop] === 'object' || typeof item[prop] === 'function') &&
                !Object.isFrozen(item[prop])) {
                Utilities.deepFreeze(item[prop]);
            }
        });
        return item;
    }
    static deepCloneAndFreeze(item) {
        return Utilities.deepFreeze(Utilities.deepClone(item));
    }
    static omit(object, keys) {
        const cloned = this.deepClone(object);
        for (const key of keys) {
            delete cloned[key];
        }
        return cloned;
    }
}
exports.Utilities = Utilities;
//# sourceMappingURL=Utilities.js.map