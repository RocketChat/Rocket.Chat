import type { IRoom } from '@rocket.chat/core-typings';

export type JoinRoomMethod = (rid: IRoom['_id'], code?: unknown) => void;
