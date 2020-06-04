import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
	IRoomTypeConfig,
	IRoomTypeRouteConfig,
	RoomTypeConfig,
	RoomTypeRouteConfig,
	RoomSettingsEnum,
	UiTextContext, IRoomTypeConfigDependencies,
} from '../../utils/lib/RoomTypeConfig';
import { IUser } from '../../../definition/IUser';
import { IRoomCommonUtils } from '../../utils/lib/IRoomCommonUtils';
import { ILivechatInquiryRepository } from '../../models/lib/ILivechatInquiryRepository';
import { RoomTypes } from '../../../definition/IRoom';

class LivechatRoomRoute extends RoomTypeRouteConfig implements IRoomTypeRouteConfig {
	private RoomCommonUtils: IRoomCommonUtils;

	constructor(RoomCommonUtils: IRoomCommonUtils) {
		super({
			name: 'live',
			path: '/live/:id',
		});
		this.action = this.action.bind(this);
		this.RoomCommonUtils = RoomCommonUtils;
	}

	action(params: any): any {
		this.RoomCommonUtils.openRoom('l', params.id);
	}

	link(sub: any): any {
		return {
			id: sub.rid,
		};
	}
}

export default class LivechatRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	private LivechatInquiry: ILivechatInquiryRepository;

	public notSubscribedTpl: string;

	public readOnlyTpl: string;

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
	LivechatInquiry: ILivechatInquiryRepository) {
		super({
			identifier: RoomTypes.OMNICHANNEL,
			order: 5,
			icon: 'omnichannel',
			label: 'Omnichannel',
			route: new LivechatRoomRoute(RoomCommonUtils),
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
		this.notSubscribedTpl = 'livechatNotSubscribed';
		this.readOnlyTpl = 'livechatReadOnly';
		this.LivechatInquiry = LivechatInquiry;
	}

	enableMembersListProfile(): boolean {
		return true;
	}

	findRoom(identifier: string): any {
		return this.Rooms.findOne({ _id: identifier });
	}

	roomName(roomData: any): string {
		return roomData.name || roomData.fname || roomData.label;
	}

	condition(): boolean {
		return Boolean(this.settings.get('Livechat_enabled') && this.AuthorizationUtils.hasPermission(Meteor.userId() as string, 'view-l-room'));
	}

	canSendMessage(rid: string): boolean {
		const room = this.Rooms.findOne({ _id: rid }, { fields: { open: 1 } });
		return room && room.open === true;
	}

	getUserStatus(rid: string): string {
		const room = Session.get(`roomData${ rid }`);
		if (room) {
			return room.v && room.v.status;
		}
		const inquiry = this.LivechatInquiry.findOne({ rid });
		return inquiry && inquiry.v && inquiry.v.status;
	}

	allowRoomSettingChange(room: any, setting: RoomSettingsEnum): boolean {
		switch (setting) {
			case RoomSettingsEnum.JOIN_CODE:
				return false;
			default:
				return true;
		}
	}

	getUiText(context: string): string {
		switch (context) {
			case UiTextContext.HIDE_WARNING:
				return 'Hide_Livechat_Warning';
			case UiTextContext.LEAVE_WARNING:
				return 'Hide_Livechat_Warning';
			default:
				return '';
		}
	}

	readOnly(rid: string, user: IUser): boolean {
		const room = this.Rooms.findOne({ _id: rid }, { fields: { open: 1, servedBy: 1 } });
		if (!room || !room.open) {
			return true;
		}

		const inquiry = this.LivechatInquiry.findOne({ rid }, { fields: { status: 1 } });
		if (inquiry && inquiry.status === 'queued') {
			return true;
		}

		return (!room.servedBy || room.servedBy._id !== user._id) && !this.AuthorizationUtils.hasPermission(Meteor.userId() as string, 'view-livechat-rooms');
	}

	getAvatarPath(roomData: any): string {
		return this.CommonUtils.getAvatarURL({ username: `@${ this.roomName(roomData) }` });
	}

	openCustomProfileTab(instance: any, room: any, username: string): boolean {
		if (!room || !room.v || room.v.username !== username) {
			return false;
		}
		const button = instance.tabBar.getButtons().find((button) => button.id === 'visitor-info');
		if (!button) {
			return false;
		}

		const { template, i18nTitle: label, icon } = button;
		instance.tabBar.setTemplate(template);
		instance.tabBar.setData({
			label,
			icon,
		});

		instance.tabBar.open();
		return true;
	}
}
