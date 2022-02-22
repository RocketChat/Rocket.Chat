import { hasPermission } from '../../../../app/authorization/client';
import { ChatRoom } from '../../../../app/models/client';
import { settings } from '../../../../app/settings/client';
import { getAvatarURL } from '../../../../app/utils/lib/getAvatarURL';
import type { IRoom } from '../../../../definition/IRoom';
import type { IRoomTypeClientDirectives } from '../../../../definition/IRoomTypeConfig';
import type { AtLeast } from '../../../../definition/utils';
import { getVoipRoomType } from '../../../../lib/rooms/roomTypes/voip';
import { roomCoordinator } from '../roomCoordinator';

export const VoipRoomType = getVoipRoomType(roomCoordinator);

roomCoordinator.add(VoipRoomType, {
	roomName(room: any): string | undefined {
		return room.name || room.fname || room.label;
	},

	condition(): boolean {
		return settings.get('Livechat_enabled') && hasPermission('view-l-room');
	},

	getAvatarPath(room): string {
		return getAvatarURL({ username: `@${this.roomName(room)}` }) || '';
	},

	findRoom(identifier: string): IRoom | undefined {
		return ChatRoom.findOne({ _id: identifier });
	},

	canSendMessage(_rid: string): boolean {
		return false;
	},

	readOnly(_rid: string, _user): boolean {
		return true;
	},
} as AtLeast<IRoomTypeClientDirectives, 'roomName'>);
