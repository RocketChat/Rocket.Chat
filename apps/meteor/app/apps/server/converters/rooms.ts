import type { IAppRoomsConverter, IAppServerOrchestrator, IAppsRoom, IAppsLivechatRoom, IAppsRoomRaw } from '@rocket.chat/apps';
import type { IRoom } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import * as z from 'zod';

import { appRoomToRocketChat, createRoomCodec, decodeRoomRaw } from './codecs/rooms';

export class AppRoomsConverter implements IAppRoomsConverter {
	private readonly codec: ReturnType<typeof createRoomCodec>;

	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
		this.codec = createRoomCodec(orch);
	}

	async convertById(roomId: IRoom['_id']): Promise<IAppsRoom | undefined> {
		const room = await Rooms.findOneById(roomId);

		return this.convertRoom(room);
	}

	async convertByName(roomName: IRoom['name']): Promise<IAppsRoom | undefined> {
		const room = await Rooms.findOneByName(roomName as string);

		return this.convertRoom(room);
	}

	convertRoomRaw(room: IRoom): Promise<IAppsRoomRaw>;

	convertRoomRaw(room: IRoom | undefined | null): Promise<IAppsRoomRaw | undefined>;

	convertRoomRaw(room: IRoom | undefined | null): Promise<IAppsRoomRaw | undefined> {
		if (!room) {
			return Promise.resolve(undefined);
		}

		return decodeRoomRaw(room);
	}

	async convertAppRoom(room: undefined | null): Promise<undefined>;

	async convertAppRoom(room: IAppsRoom): Promise<IRoom>;

	async convertAppRoom(room: IAppsRoom, isPartial: boolean): Promise<Partial<IRoom>>;

	async convertAppRoom(room: IAppsRoom | undefined | null, isPartial?: boolean): Promise<Partial<IRoom> | undefined>;

	async convertAppRoom(room: IAppsRoom | undefined | null, isPartial = false): Promise<Partial<IRoom> | undefined> {
		if (!room) {
			return undefined;
		}

		if (isPartial) {
			return appRoomToRocketChat(room, true);
		}

		return z.encodeAsync(this.codec, room);
	}

	convertRoom(originalRoom: undefined | null): Promise<undefined>;

	convertRoom(originalRoom: IRoom): Promise<IAppsRoom | IAppsLivechatRoom>;

	convertRoom(originalRoom: IRoom | undefined | null): Promise<IAppsRoom | IAppsLivechatRoom | undefined>;

	convertRoom(originalRoom: IRoom | undefined | null): Promise<IAppsRoom | IAppsLivechatRoom | undefined> {
		if (!originalRoom) {
			return Promise.resolve(undefined);
		}

		return z.decodeAsync(this.codec, originalRoom);
	}
}
