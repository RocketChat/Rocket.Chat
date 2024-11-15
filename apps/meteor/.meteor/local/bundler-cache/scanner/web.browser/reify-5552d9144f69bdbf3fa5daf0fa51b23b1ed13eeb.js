"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLogout = void 0;
const fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
const react_1 = require("react");
const UserContext_1 = require("../UserContext");
const useRouter_1 = require("./useRouter");
const useLogout = () => {
    const router = (0, useRouter_1.useRouter)();
    const { logout } = (0, react_1.useContext)(UserContext_1.UserContext);
    const handleLogout = (0, fuselage_hooks_1.useMutableCallback)(() => {
        logout();
        router.navigate('/');
    });
    return handleLogout;
};
exports.useLogout = useLogout;
//# sourceMappingURL=useLogout.js.map