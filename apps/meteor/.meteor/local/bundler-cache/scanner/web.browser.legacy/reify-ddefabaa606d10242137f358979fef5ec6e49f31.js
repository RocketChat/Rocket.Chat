"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useToastMessageDispatch = void 0;
const react_1 = require("react");
const ToastMessagesContext_1 = require("../ToastMessagesContext");
const useToastMessageDispatch = () => (0, react_1.useContext)(ToastMessagesContext_1.ToastMessagesContext).dispatch;
exports.useToastMessageDispatch = useToastMessageDispatch;
//# sourceMappingURL=useToastMessageDispatch.js.map