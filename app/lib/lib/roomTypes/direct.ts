import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
	IRoomTypeConfig,
	IRoomTypeRouteConfig,
	RoomTypeConfig,
	RoomTypeRouteConfig,
	RoomSettingsEnum,
	RoomMemberActions,
	UiTextContext, IRoomTypeConfigDependencies,
} from '../../../utils/lib/RoomTypeConfig';
import { IUser } from '../../../../definition/IUser';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { IRoomCommonUtils } from '../../../utils/lib/IRoomCommonUtils';
import { RoomTypes } from '../../../../definition/IRoom';

export class DirectMessageRoomRoute extends RoomTypeRouteConfig implements IRoomTypeRouteConfig {
	private RoomCommonUtils: IRoomCommonUtils;

	constructor(RoomCommonUtils: IRoomCommonUtils) {
		super({
			name: 'direct',
			path: '/direct/:rid',
		});
		this.action = this.action.bind(this);
		this.RoomCommonUtils = RoomCommonUtils;
	}

	action(params: any): any {
		return this.RoomCommonUtils.openRoom('d', params.rid);
	}

	link(sub: any): any {
		return { rid: sub.rid || sub.name };
	}
}

export class DirectMessageRoomType extends RoomTypeConfig implements IRoomTypeConfig {
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
			identifier: RoomTypes.DIRECT,
			order: 50,
			icon: 'at',
			label: 'Direct_Messages',
			route: new DirectMessageRoomRoute(RoomCommonUtils),
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
		if (this.isGroupChat(roomData)) {
			return 'team';
		}
		return this.icon;
	}

	findRoom(identifier: string): any {
		if (!this.AuthorizationUtils.hasPermission(Meteor.userId() as string, 'view-d-room')) {
			return null;
		}

		const query = {
			t: 'd',
			$or: [
				{ name: identifier },
				{ rid: identifier },
			],
		};

		const subscription = this.Subscriptions.findOne(query);
		if (subscription && subscription.rid) {
			return this.Rooms.findOne({ _id: subscription.rid });
		}
	}

	roomName(roomData: any): string {
		// this function can receive different types of data
		// if it doesn't have fname and name properties, should be a Room object
		// so, need to find the related subscription
		const subscription = roomData && (roomData.fname || roomData.name)
			? roomData
			: this.Subscriptions.findOne({ rid: roomData._id });

		if (subscription === undefined) {
			return '';
		}

		if (this.settings.get('UI_Use_Real_Name') && subscription.fname) {
			return subscription.fname;
		}

		return subscription.name;
	}

	secondaryRoomName(roomData: any): string {
		if (this.settings.get('UI_Use_Real_Name')) {
			const subscription = this.Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });
			return subscription && subscription.name;
		}
		return '';
	}

	condition(): boolean {
		const groupByType = this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarGroupByType');
		return groupByType && this.AuthorizationUtils.hasAtLeastOnePermission(Meteor.userId() as string, ['view-d-room', 'view-joined-room']);
	}

	getUserStatus(roomId: string): string {
		const subscription = this.Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return '';
		}

		return Session.get(`user_${ subscription.name }_status`);
	}

	getUserStatusText(roomId: string): string {
		const subscription = this.Subscriptions.findOne({ rid: roomId });
		if (subscription == null) {
			return '';
		}

		return Session.get(`user_${ subscription.name }_status_text`);
	}

	allowRoomSettingChange(room: any, setting: RoomSettingsEnum): boolean {
		switch (setting) {
			case RoomSettingsEnum.TYPE:
			case RoomSettingsEnum.NAME:
			case RoomSettingsEnum.SYSTEM_MESSAGES:
			case RoomSettingsEnum.DESCRIPTION:
			case RoomSettingsEnum.READ_ONLY:
			case RoomSettingsEnum.REACT_WHEN_READ_ONLY:
			case RoomSettingsEnum.ARCHIVE_OR_UNARCHIVE:
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			case RoomSettingsEnum.E2E:
				return this.settings.get('E2E_Enable') === true;
			default:
				return true;
		}
	}

	allowMemberAction(room: any, action: RoomMemberActions): boolean {
		switch (action) {
			case RoomMemberActions.BLOCK:
				return !this.isGroupChat(room);
			default:
				return false;
		}
	}

	enableMembersListProfile(): boolean {
		return true;
	}

	userDetailShowAll(/* room */): boolean {
		return true;
	}

	getUiText(context: UiTextContext): string {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Private_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Leave_Private_Warning';
			default:
				return '';
		}
	}

	/**
     * Returns details to use on notifications
     *
     * @param {object} room
     * @param {object} user
     * @param {string} notificationMessage
     * @return {object} Notification details
     */
	getNotificationDetails(room: any, user: IUser, notificationMessage: string): any {
		if (!Meteor.isServer) {
			return {};
		}

		if (this.isGroupChat(room)) {
			return {
				title: this.roomName(room),
				text: `${ (this.settings.get('UI_Use_Real_Name') && user.name) || user.username }: ${ notificationMessage }`,
			};
		}

		return {
			title: (this.settings.get('UI_Use_Real_Name') && user.name) || user.username,
			text: notificationMessage,
		};
	}

	getAvatarPath(roomData: any, subData: any): string {
		if (!roomData && !subData) {
			return '';
		}

		if (this.isGroupChat(roomData)) {
			return this.CommonUtils.getAvatarURL({ username: roomData.uids.length + roomData.usernames.join() });
		}

		const sub = subData || this.Subscriptions.findOne({ rid: roomData._id }, { fields: { name: 1 } });

		if (sub && sub.name) {
			return this.UserCommonUtils.getUserAvatarURL(sub.name);
		}

		if (roomData) {
			return this.UserCommonUtils.getUserAvatarURL(roomData.name || this.roomName(roomData)); // rooms should have no name for direct messages...
		}
		return '';
	}

	includeInDashboard(): boolean {
		return true;
	}

	isGroupChat(room?: any): boolean {
		return room && room.uids && room.uids.length > 2;
	}
}
