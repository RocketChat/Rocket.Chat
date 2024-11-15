"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLayoutSizes = void 0;
const react_1 = require("react");
const LayoutContext_1 = require("../LayoutContext");
const useLayoutSizes = () => (0, react_1.useContext)(LayoutContext_1.LayoutContext).size;
exports.useLayoutSizes = useLayoutSizes;
//# sourceMappingURL=useLayoutSizes.js.map