import type { IRoom } from '@rocket.chat/core-typings';

import type { IAppsRoom, IAppsLivechatRoom } from '../AppsEngine';

export type RoomConversionOptions = {
	lightweight?: boolean;
};

export interface IAppRoomsConverter {
	convertById(roomId: IRoom['_id']): Promise<IAppsRoom | undefined>;
	convertByName(roomName: IRoom['name']): Promise<IAppsRoom | undefined>;
	convertRoom(room: undefined | null, options?: RoomConversionOptions): Promise<undefined>;
	convertRoom(room: IRoom, options?: RoomConversionOptions): Promise<IAppsRoom | IAppsLivechatRoom>;
	convertRoom(room: IRoom | undefined | null, options?: RoomConversionOptions): Promise<IAppsRoom | IAppsLivechatRoom | undefined>;
	convertAppRoom(room: undefined | null): Promise<undefined>;
	convertAppRoom(room: IAppsRoom): Promise<IRoom>;
	convertAppRoom(room: IAppsRoom, isPartial: boolean): Promise<Partial<IRoom>>;
	convertAppRoom(room: IAppsRoom | undefined | null, isPartial?: boolean): Promise<Partial<IRoom> | undefined>;
}
