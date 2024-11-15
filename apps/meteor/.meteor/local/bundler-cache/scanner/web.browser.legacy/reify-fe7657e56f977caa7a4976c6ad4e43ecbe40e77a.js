"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarUrlContext = void 0;
const react_1 = require("react");
const dummy = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQYV2Oora39DwAFaQJ3y3rKeAAAAABJRU5ErkJggg==';
exports.AvatarUrlContext = (0, react_1.createContext)({
    getUserPathAvatar: () => dummy,
    getRoomPathAvatar: () => dummy,
});
//# sourceMappingURL=AvatarUrlContext.js.map