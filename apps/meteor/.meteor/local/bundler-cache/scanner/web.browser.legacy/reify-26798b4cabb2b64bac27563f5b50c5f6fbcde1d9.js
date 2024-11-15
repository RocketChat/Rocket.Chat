"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomSoundContext = void 0;
const react_1 = require("react");
exports.CustomSoundContext = (0, react_1.createContext)({
    play: () => new Promise(() => undefined),
    pause: () => undefined,
    stop: () => undefined,
    getList: () => undefined,
    isPlaying: () => false,
});
//# sourceMappingURL=CustomSoundContext.js.map