import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { IRoom, RoomType, IUser, IMessage, ReadReceipt, ValueOf, AtLeast } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import type { IRoomTypeConfig, IRoomTypeServerDirectives, RoomSettingsEnum, RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { RoomCoordinator } from '../../../lib/rooms/coordinator';

class RoomCoordinatorServer extends RoomCoordinator {
	add(roomConfig: IRoomTypeConfig, directives: Partial<IRoomTypeServerDirectives>): void {
		this.addRoomType(roomConfig, {
			allowRoomSettingChange(_room: IRoom, _setting: ValueOf<typeof RoomSettingsEnum>) {
				return true;
			},
			async allowMemberAction(_room: IRoom, _action: ValueOf<typeof RoomMemberActions>, _userId?: IUser['_id']): Promise<boolean> {
				return false;
			},
			async roomName(_room: IRoom, _userId?: string): Promise<string> {
				return '';
			},
			isGroupChat(_room: IRoom): boolean {
				return false;
			},
			async canBeDeleted(hasPermission: (permissionId: string, rid?: string) => Promise<boolean> | boolean, room: IRoom): Promise<boolean> {
				if (!hasPermission && typeof hasPermission !== 'function') {
					throw new Error('You MUST provide the "hasPermission" to canBeDeleted function');
				}
				return hasPermission(`delete-${room.t}`, room._id);
			},
			preventRenaming(): boolean {
				return false;
			},
			async getDiscussionType(): Promise<RoomType> {
				return 'p';
			},
			async canAccessUploadedFile(_params: { rc_uid: string; rc_rid: string; rc_token: string }): Promise<boolean> {
				return false;
			},
			async getNotificationDetails(
				room: IRoom,
				sender: AtLeast<IUser, '_id' | 'name' | 'username'>,
				notificationMessage: string,
				userId: string,
			): Promise<{ title: string | undefined; text: string; name: string | undefined }> {
				const title = `#${await this.roomName(room, userId)}`;
				const useRealName = settings.get<boolean>('UI_Use_Real_Name');
				const senderName = getUserDisplayName(sender.name, sender.username, useRealName);

				const text = `${senderName}: ${notificationMessage}`;

				return { title, text, name: room.name };
			},
			getMsgSender(message: IMessage): Promise<IUser | null> {
				return Users.findOneById(message.u._id);
			},
			includeInRoomSearch(): boolean {
				return false;
			},
			getReadReceiptsExtraData(_message: IMessage): Partial<ReadReceipt> {
				return {};
			},
			includeInDashboard(): boolean {
				return false;
			},

			...directives,
			config: roomConfig,
		});
	}

	getRoomDirectives(roomType: string): IRoomTypeServerDirectives {
		const directives = this.roomTypes[roomType]?.directives;

		if (!directives) {
			throw new Error(`Room type ${roomType} not found`);
		}
		return directives as IRoomTypeServerDirectives;
	}

	getTypesToShowOnDashboard(): Array<IRoomTypeConfig['identifier']> {
		return Object.keys(this.roomTypes).filter((key) => (this.roomTypes[key].directives as IRoomTypeServerDirectives).includeInDashboard());
	}

	async getRoomName(roomType: string, roomData: IRoom, userId?: string): Promise<string> {
		return (await this.getRoomDirectives(roomType).roomName(roomData, userId)) ?? '';
	}

	setRoomFind(roomType: string, roomFind: Required<Pick<IRoomTypeServerDirectives, 'roomFind'>>['roomFind']): void {
		const directives = this.getRoomDirectives(roomType);
		if (!directives) {
			return;
		}

		if (directives.roomFind) {
			throw new Error('Room find for the given type already exists');
		}

		directives.roomFind = roomFind;
	}

	getRoomFind(roomType: string): Required<Pick<IRoomTypeServerDirectives, 'roomFind'>>['roomFind'] | undefined {
		return this.getRoomDirectives(roomType).roomFind;
	}

	searchableRoomTypes(): Array<string> {
		return Object.entries(this.roomTypes)
			.filter(([_identifier, { directives }]) => (directives as IRoomTypeServerDirectives).includeInRoomSearch())
			.map(([identifier]) => identifier);
	}
}

export const roomCoordinator = new RoomCoordinatorServer();
