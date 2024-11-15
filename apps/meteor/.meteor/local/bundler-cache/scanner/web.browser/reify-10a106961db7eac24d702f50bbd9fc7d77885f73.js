"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCurrentModal = void 0;
const react_1 = require("react");
const ModalContext_1 = require("../ModalContext");
/**
 * Similar to useModal this hook return the current modal from the context value
 */
const useCurrentModal = () => {
    var _a;
    const context = (0, react_1.useContext)(ModalContext_1.ModalContext);
    if (!context) {
        throw new Error('useCurrentModal must be used inside Modal Context');
    }
    if (((_a = context.currentModal) === null || _a === void 0 ? void 0 : _a.region) !== context.region) {
        return null;
    }
    return context.currentModal.component;
};
exports.useCurrentModal = useCurrentModal;
//# sourceMappingURL=useCurrentModal.js.map