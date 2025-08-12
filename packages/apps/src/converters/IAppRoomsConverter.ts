import type { IRoom } from '@rocket.chat/core-typings';

import type { IAppsRoom, IAppsLivechatRoom } from '../AppsEngine';

export interface IAppRoomsConverter {
	convertById(roomId: IRoom['_id']): Promise<IAppsRoom | undefined>;
	convertByName(roomName: IRoom['name']): Promise<IAppsRoom | undefined>;
	convertRoom(room: undefined | null): Promise<undefined>;
	convertRoom(room: IRoom): Promise<IAppsRoom | IAppsLivechatRoom>;
	convertRoom(room: IRoom | undefined | null): Promise<IAppsRoom | IAppsLivechatRoom | undefined>;
	convertAppRoom(room: undefined | null): Promise<undefined>;
	convertAppRoom(room: IAppsRoom): Promise<IRoom>;
	convertAppRoom(room: IAppsRoom, isPartial: boolean): Promise<Partial<IRoom>>;
	convertAppRoom(room: IAppsRoom | undefined | null, isPartial?: boolean): Promise<Partial<IRoom> | undefined>;
}
