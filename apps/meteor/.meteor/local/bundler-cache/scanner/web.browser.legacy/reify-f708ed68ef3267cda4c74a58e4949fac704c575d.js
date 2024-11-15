"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isICallServerConfigData = exports.ServerType = void 0;
var ServerType;
(function (ServerType) {
    ServerType["MANAGEMENT"] = "management";
    ServerType["CALL_SERVER"] = "call-server";
})(ServerType || (exports.ServerType = ServerType = {}));
const isICallServerConfigData = (obj) => String(obj.websocketPath) === obj.websocketPath;
exports.isICallServerConfigData = isICallServerConfigData;
//# sourceMappingURL=IVoipServerConfig.js.map