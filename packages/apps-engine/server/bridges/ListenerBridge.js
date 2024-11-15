"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListenerBridge = void 0;
const BaseBridge_1 = require("./BaseBridge");
class ListenerBridge extends BaseBridge_1.BaseBridge {
    doMessageEvent(int, message) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.messageEvent(int, message);
        });
    }
    doRoomEvent(int, room) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.roomEvent(int, room);
        });
    }
}
exports.ListenerBridge = ListenerBridge;
//# sourceMappingURL=ListenerBridge.js.map