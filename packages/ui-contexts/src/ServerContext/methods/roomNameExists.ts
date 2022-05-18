import type { IRoom } from '@rocket.chat/core-typings';

export type RoomNameExistsMethod = (name: IRoom['name']) => boolean;
