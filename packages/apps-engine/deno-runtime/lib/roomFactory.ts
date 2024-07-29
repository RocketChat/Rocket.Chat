import type { IRoom } from "@rocket.chat/apps-engine/definition/rooms/IRoom.ts";
import type { AppManager } from "@rocket.chat/apps-engine/server/AppManager.ts";

import { AppAccessors } from "./accessors/mod.ts";
import { Room } from "./room.ts";
import { JsonRpcError } from "jsonrpc-lite";

const getMockAppManager = (senderFn: AppAccessors['senderFn']) => ({
    getBridges: () => ({
        getInternalBridge: () => ({
            doGetUsernamesOfRoomById: (roomId: string) => {
                return senderFn({
                    method: 'bridges:getInternalBridge:doGetUsernamesOfRoomById',
                    params: [roomId],
                }).then((result) => result.result).catch((err) => {
                    throw new JsonRpcError(`Error getting usernames of room: ${err}`, -32000);
                })
            },
        }),
    }),
});

export default function createRoom(room: IRoom, senderFn: AppAccessors['senderFn']) {
    const mockAppManager = getMockAppManager(senderFn);

    return new Room(room, mockAppManager as unknown as AppManager);
}
