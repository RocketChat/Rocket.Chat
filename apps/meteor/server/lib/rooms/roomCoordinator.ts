import type { IRoom, RoomType, IUser, IMessage, ReadReceipt, IRocketChatRecord, ValueOf, AtLeast } from '@rocket.chat/core-typings';

import type { IRoomTypeConfig, IRoomTypeServerDirectives } from '../../../definition/IRoomTypeConfig';
import { Users } from '../../../app/models/server';
import { RoomSettingsEnum, RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { RoomCoordinator } from '../../../lib/rooms/coordinator';
import { settings } from '../../../app/settings/server';

class RoomCoordinatorServer extends RoomCoordinator {
	add(roomConfig: IRoomTypeConfig, directives: Partial<IRoomTypeServerDirectives>): void {
		this.addRoomType(roomConfig, {
			allowRoomSettingChange(_room: IRoom, _setting: ValueOf<typeof RoomSettingsEnum>): boolean {
				return true;
			},
			allowMemberAction(_room: IRoom, _action: ValueOf<typeof RoomMemberActions>): boolean {
				return false;
			},
			roomName(_room: IRoom, _userId?: string): string {
				return '';
			},
			isGroupChat(_room: IRoom): boolean {
				return false;
			},
			canBeDeleted(hasPermission: (permissionId: string, rid?: string) => boolean, room: IRoom): boolean {
				if (!hasPermission && typeof hasPermission !== 'function') {
					throw new Error('You MUST provide the "hasPermission" to canBeDeleted function');
				}
				return hasPermission(`delete-${room.t}`, room._id);
			},
			preventRenaming(): boolean {
				return false;
			},
			getDiscussionType(): RoomType {
				return 'p';
			},
			canAccessUploadedFile(_params: { rc_uid: string; rc_rid: string; rc_token: string }): boolean {
				return false;
			},
			getNotificationDetails(
				room: IRoom,
				sender: AtLeast<IUser, '_id' | 'name' | 'username'>,
				notificationMessage: string,
				userId: string,
			): { title: string | undefined; text: string } {
				const title = `#${this.roomName(room, userId)}`;
				const name = settings.get<boolean>('UI_Use_Real_Name') ? sender.name : sender.username;

				const text = `${name}: ${notificationMessage}`;

				return { title, text };
			},
			getMsgSender(senderId: IRocketChatRecord['_id']): IRocketChatRecord | undefined {
				return Users.findOneById(senderId);
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

	getRoomDirectives(roomType: string): IRoomTypeServerDirectives | undefined {
		return this.roomTypes[roomType]?.directives as IRoomTypeServerDirectives;
	}

	openRoom(_type: string, _name: string, _render = true): void {
		// Nothing to do on the server side.
	}

	getTypesToShowOnDashboard(): Array<IRoomTypeConfig['identifier']> {
		return Object.keys(this.roomTypes).filter((key) => (this.roomTypes[key].directives as IRoomTypeServerDirectives).includeInDashboard());
	}

	getRoomName(roomType: string, roomData: IRoom, userId?: string): string {
		return this.getRoomDirectives(roomType)?.roomName(roomData, userId) ?? '';
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
		return this.getRoomDirectives(roomType)?.roomFind;
	}

	searchableRoomTypes(): Array<string> {
		return Object.entries(this.roomTypes)
			.filter(([_identifier, { directives }]) => (directives as IRoomTypeServerDirectives).includeInRoomSearch())
			.map(([identifier]) => identifier);
	}
}

export const roomCoordinator = new RoomCoordinatorServer();
