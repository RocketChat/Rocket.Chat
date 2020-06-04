import { Meteor } from 'meteor/meteor';

import {
	IRoomTypeConfig,
	IRoomTypeRouteConfig,
	RoomTypeConfig,
	RoomTypeRouteConfig,
	RoomSettingsEnum,
	UiTextContext,
	RoomMemberActions, IRoomTypeConfigDependencies,
} from '../../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { IRoomCommonUtils } from '../../../utils/lib/IRoomCommonUtils';
import { RoomTypes } from '../../../../definition/IRoom';

export class PublicRoomRoute extends RoomTypeRouteConfig implements IRoomTypeRouteConfig {
	private RoomCommonUtils: IRoomCommonUtils;

	constructor(RoomCommonUtils: IRoomCommonUtils) {
		super({
			name: 'channel',
			path: '/channel/:name',
		});
		this.action = this.action.bind(this);
		this.RoomCommonUtils = RoomCommonUtils;
	}

	action(params: any): any {
		return this.RoomCommonUtils.openRoom('c', params.name);
	}
}

export class PublicRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	private UserCommonUtils: IUserCommonUtils;

	constructor({
		settings,
		Users,
		Rooms,
		Subscriptions,
		AuthorizationUtils,
		RoomCommonUtils,
		CommonUtils,
		RoomTypesCommon,
	}: IRoomTypeConfigDependencies,
	UserCommonUtils: IUserCommonUtils) {
		super({
			identifier: RoomTypes.PUBLIC,
			order: 30,
			icon: 'hashtag',
			label: 'Channels',
			route: new PublicRoomRoute(RoomCommonUtils),
		},
		{
			settings,
			Users,
			Rooms,
			Subscriptions,
			AuthorizationUtils,
			RoomCommonUtils,
			CommonUtils,
			RoomTypesCommon,
		});
		this.UserCommonUtils = UserCommonUtils;
	}

	getIcon(roomData: any): string | undefined {
		if (roomData.prid) {
			return 'discussion';
		}
		return this.icon;
	}

	findRoom(identifier: string): any {
		const query = {
			t: 'c',
			name: identifier,
		};
		return this.Rooms.findOne(query);
	}

	roomName(roomData: any): string {
		if (roomData.prid) {
			return roomData.fname;
		}
		if (this.settings.get('UI_Allow_room_names_with_special_chars')) {
			return roomData.fname || roomData.name;
		}
		return roomData.name;
	}

	condition(): boolean {
		const groupByType = this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarGroupByType');
		return groupByType && (this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['view-c-room', 'view-joined-room']) || this.settings.get('Accounts_AllowAnonymousRead') === true);
	}

	showJoinLink(roomId: string): boolean {
		return !!this.Rooms.findOne({ _id: roomId, t: 'c' });
	}

	includeInRoomSearch(): boolean {
		return true;
	}

	isGroupChat(): boolean {
		return true;
	}

	includeInDashboard(): boolean {
		return true;
	}

	canAddUser(room: any): boolean {
		return this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['add-user-to-any-c-room', 'add-user-to-joined-room'], room._id);
	}

	canSendMessage(roomId: string): boolean {
		const room = this.Rooms.findOne({ _id: roomId, t: 'c' }, { fields: { prid: 1 } });
		if (room.prid) {
			return true;
		}

		// TODO: remove duplicated code
		return this.Subscriptions.find({
			rid: roomId,
		}).count() > 0;
	}

	enableMembersListProfile(): boolean {
		return true;
	}

	allowRoomSettingChange(room: any, setting: RoomSettingsEnum): boolean {
		switch (setting) {
			case RoomSettingsEnum.BROADCAST:
				return room.broadcast;
			case RoomSettingsEnum.READ_ONLY:
				return !room.broadcast;
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
				return !room.broadcast && room.ro;
			case RoomSettingsEnum.E2E:
				return false;
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			default:
				return true;
		}
	}

	allowMemberAction(room: any, action: RoomMemberActions): boolean {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return false;
			default:
				return true;
		}
	}

	getUiText(context: UiTextContext): string {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Room_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Room_Warning';
			default:
				return '';
		}
	}

	getAvatarPath(roomData: any): string {
		// TODO: change to always get avatar from _id when rooms have avatars

		return this.CommonUtils.getAvatarURL({ username: `@${ this.roomName(roomData) }` });
	}

	getDiscussionType(): string {
		return 'c';
	}
}
