"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentalVariableRead = void 0;
class EnvironmentalVariableRead {
    constructor(bridge, appId) {
        this.bridge = bridge;
        this.appId = appId;
    }
    getValueByName(envVarName) {
        return this.bridge.doGetValueByName(envVarName, this.appId);
    }
    isReadable(envVarName) {
        return this.bridge.doIsReadable(envVarName, this.appId);
    }
    isSet(envVarName) {
        return this.bridge.doIsSet(envVarName, this.appId);
    }
}
exports.EnvironmentalVariableRead = EnvironmentalVariableRead;
//# sourceMappingURL=EnvironmentalVariableRead.js.map