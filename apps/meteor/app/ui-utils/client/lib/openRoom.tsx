import type { RoomType } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';

type OpenRoomParams = { type: RoomType; name: string; render?: boolean };

const emitter = new Emitter<{ update: void }>();
let openRoomParams: OpenRoomParams | undefined;

export const getSnapshot = () => openRoomParams;

export const subscribe = (onStoreChange: () => void): (() => void) => emitter.on('update', onStoreChange);

export function openRoom(type: RoomType, name: string, render = true) {
	openRoomParams = { type, name, render };
	emitter.emit('update');
}
