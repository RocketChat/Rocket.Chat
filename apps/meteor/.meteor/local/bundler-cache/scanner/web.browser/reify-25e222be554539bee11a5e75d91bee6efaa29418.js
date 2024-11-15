"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLayoutHiddenActions = void 0;
const react_1 = require("react");
const LayoutContext_1 = require("../LayoutContext");
const useLayoutHiddenActions = () => (0, react_1.useContext)(LayoutContext_1.LayoutContext).hiddenActions;
exports.useLayoutHiddenActions = useLayoutHiddenActions;
//# sourceMappingURL=useLayoutHiddenActions.js.map