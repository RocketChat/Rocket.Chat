"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUserAvatarPath = void 0;
const react_1 = require("react");
const AvatarUrlContext_1 = require("../AvatarUrlContext");
const useUserAvatarPath = () => (0, react_1.useContext)(AvatarUrlContext_1.AvatarUrlContext).getUserPathAvatar;
exports.useUserAvatarPath = useUserAvatarPath;
//# sourceMappingURL=useUserAvatarPath.js.map