"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSessionDispatch = void 0;
const react_1 = require("react");
const SessionContext_1 = require("../SessionContext");
const useSessionDispatch = (name) => {
    const { dispatch } = (0, react_1.useContext)(SessionContext_1.SessionContext);
    return (0, react_1.useCallback)((value) => dispatch(name, value), [dispatch, name]);
};
exports.useSessionDispatch = useSessionDispatch;
//# sourceMappingURL=useSessionDispatch.js.map