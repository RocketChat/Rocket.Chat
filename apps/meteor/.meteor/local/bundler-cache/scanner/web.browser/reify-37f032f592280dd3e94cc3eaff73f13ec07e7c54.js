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
exports.useGoToRoom = void 0;
const fuselage_hooks_1 = require("@rocket.chat/fuselage-hooks");
const useEndpoint_1 = require("./useEndpoint");
const useRouter_1 = require("./useRouter");
const useGoToRoom = ({ replace = false } = {}) => {
    const router = (0, useRouter_1.useRouter)();
    const getRoomById = (0, useEndpoint_1.useEndpoint)('GET', '/v1/rooms.info');
    return (0, fuselage_hooks_1.useEffectEvent)((roomId) => __awaiter(void 0, void 0, void 0, function* () {
        const { room } = yield getRoomById({ roomId });
        if (!room) {
            return;
        }
        const { t, name, _id: rid } = room;
        const { path } = router.getRoomRoute(t, ['c', 'p'].includes(t) ? { name } : { rid });
        router.navigate({
            pathname: path,
        }, { replace });
    }));
};
exports.useGoToRoom = useGoToRoom;
//# sourceMappingURL=useGoToRoom.js.map