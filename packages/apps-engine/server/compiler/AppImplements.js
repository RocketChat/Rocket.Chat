"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppImplements = void 0;
const AppInterface_1 = require("../../definition/metadata/AppInterface");
const Utilities_1 = require("../misc/Utilities");
class AppImplements {
    constructor() {
        this.implemented = {};
        Object.keys(AppInterface_1.AppInterface).forEach((int) => {
            this.implemented[int] = false;
        });
    }
    doesImplement(int) {
        if (int in AppInterface_1.AppInterface) {
            this.implemented[int] = true;
        }
    }
    getValues() {
        return Utilities_1.Utilities.deepCloneAndFreeze(this.implemented);
    }
    toJSON() {
        return this.getValues();
    }
}
exports.AppImplements = AppImplements;
//# sourceMappingURL=AppImplements.js.map