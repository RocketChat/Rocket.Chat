import type { RouteOptions } from 'meteor/kadira:flow-router';

import { openRoom } from '../../../app/ui-utils/client/lib/openRoom';
import type { IRoom } from '../../../definition/IRoom';
import type { IRoomTypeConfig, IRoomTypeClientDirectives } from '../../../definition/IRoomTypeConfig';
import { RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../../../definition/IRoomTypeConfig';
import type { ValueOf } from '../../../definition/utils';
import { RoomCoordinator } from '../../../lib/rooms/coordinator';
import { roomExit } from './roomExit';

class RoomCoordinatorClient extends RoomCoordinator {
	add(roomConfig: IRoomTypeConfig, directives: Partial<IRoomTypeClientDirectives>): void {
		this.addRoomType(roomConfig, {
			allowRoomSettingChange(_room: Partial<IRoom>, _setting: ValueOf<typeof RoomSettingsEnum>): boolean {
				return true;
			},
			allowMemberAction(_room: Partial<IRoom>, _action: ValueOf<typeof RoomMemberActions>): boolean {
				return false;
			},
			roomName(_room: Partial<IRoom>): string {
				return '';
			},
			isGroupChat(_room: Partial<IRoom>): boolean {
				return false;
			},
			openCustomProfileTab(_instance: any, _room: IRoom, _username: string): boolean {
				return false;
			},
			getUiText(_context: ValueOf<typeof UiTextContext>): string {
				return '';
			},
			condition(): boolean {
				return true;
			},
			getAvatarPath(_room: Partial<IRoom> & { username?: IRoom['_id'] }): string {
				return '';
			},
			getIcon(_room: Partial<IRoom>): string | undefined {
				return this.config.icon;
			},
			getUserStatus(_roomId: string): string | undefined {
				return undefined;
			},

			...directives,
			config: roomConfig,
		});
	}

	protected addRoute(path: string, routeConfig: RouteOptions): void {
		super.addRoute(path, { ...routeConfig, triggersExit: [roomExit] });
	}

	getRoomDirectives(roomType: string): IRoomTypeClientDirectives | undefined {
		return this.roomTypes[roomType]?.directives as IRoomTypeClientDirectives;
	}

	openRoom(type: string, name: string, render = true): void {
		openRoom(type, name, render);
	}

	getIcon(room: Partial<IRoom>): string | undefined {
		return room?.t && this.getRoomDirectives(room.t)?.getIcon(room);
	}
}

export const roomCoordinator = new RoomCoordinatorClient();
