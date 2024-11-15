"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModal = void 0;
const react_1 = require("react");
const ModalContext_1 = require("../ModalContext");
/**
 * Consider using useCurrentModal to get the current modal
 */
const useModal = () => {
    const context = (0, react_1.useContext)(ModalContext_1.ModalContext);
    if (!context) {
        throw new Error('useModal must be used inside Modal Context');
    }
    return context.modal;
};
exports.useModal = useModal;
//# sourceMappingURL=useModal.js.map