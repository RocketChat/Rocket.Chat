"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTooltipOpen = void 0;
const react_1 = require("react");
const TooltipContext_1 = require("../TooltipContext");
const useTooltipOpen = () => (0, react_1.useContext)(TooltipContext_1.TooltipContext).open;
exports.useTooltipOpen = useTooltipOpen;
//# sourceMappingURL=useTooltipOpen.js.map