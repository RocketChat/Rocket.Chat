"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTooltipClose = void 0;
const react_1 = require("react");
const TooltipContext_1 = require("../TooltipContext");
const useTooltipClose = () => (0, react_1.useContext)(TooltipContext_1.TooltipContext).close;
exports.useTooltipClose = useTooltipClose;
//# sourceMappingURL=useTooltipClose.js.map