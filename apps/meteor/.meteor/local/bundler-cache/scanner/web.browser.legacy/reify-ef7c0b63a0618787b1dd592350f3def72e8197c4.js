"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAbsoluteUrl = void 0;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
const useAbsoluteUrl = () => (0, react_1.useContext)(ServerContext_1.ServerContext).absoluteUrl;
exports.useAbsoluteUrl = useAbsoluteUrl;
//# sourceMappingURL=useAbsoluteUrl.js.map