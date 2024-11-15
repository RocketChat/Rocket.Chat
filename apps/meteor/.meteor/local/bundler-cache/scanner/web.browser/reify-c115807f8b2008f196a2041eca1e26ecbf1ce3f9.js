"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRoomAvatarPath = void 0;
const react_1 = require("react");
const AvatarUrlContext_1 = require("../AvatarUrlContext");
const useRoomAvatarPath = () => (0, react_1.useContext)(AvatarUrlContext_1.AvatarUrlContext).getRoomPathAvatar;
exports.useRoomAvatarPath = useRoomAvatarPath;
//# sourceMappingURL=useRoomAvatarPath.js.map