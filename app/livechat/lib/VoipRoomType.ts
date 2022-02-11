import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';
// @ts-ignore has no exported member
import { ChatRoom } from '../../models';
// @ts-ignore has no exported member
import { settings } from '../../settings';
// @ts-ignore has no exported member
import { hasPermission } from '../../authorization';
// @ts-ignore has no exported member
import { openRoom } from '../../ui-utils';
// @ts-ignore has no exported member
import { RoomTypeRouteConfig, RoomTypeConfig } from '../../utils';
import { getAvatarURL } from '../../utils/lib/getAvatarURL';

class VoipRoomRoute extends RoomTypeRouteConfig {
	constructor() {
		super({
			name: 'voip',
			path: '/voip/:id/:tab?/:context?',
		});
	}

	action({ id }: { id: IRoom['_id'] }): void {
		openRoom('v', id);
	}

	link({ _id }: { _id: string }): { id: ISubscription['_id'] } {
		return {
			id: _id,
		};
	}
}

export default class VoipRoomType extends RoomTypeConfig {
	notSubscribedTpl;

	readOnlyTpl;

	constructor() {
		super({
			identifier: 'v',
			order: 6,
			icon: 'phone',
			label: 'Voip',
			route: new VoipRoomRoute(),
		});

		this.notSubscribedTpl = 'livechatNotSubscribed';
		this.readOnlyTpl = 'ComposerNotAvailablePhoneCalls';
	}

	findRoom(identifier: IRoom['_id']): IRoom {
		return ChatRoom.findOne({ _id: identifier });
	}

	roomName(roomData: IRoom & { label: string }): string {
		return roomData.name || roomData.fname || roomData.label;
	}

	condition(): boolean {
		return settings.get('Livechat_enabled') && hasPermission('view-l-room');
	}

	canSendMessage(): boolean {
		return false;
	}

	readOnly(): boolean {
		return true;
	}

	getAvatarPath(roomData: IRoom & { label: string }): string {
		return getAvatarURL({ username: `@${this.roomName(roomData)}`, roomId: undefined, cache: undefined });
	}
}
