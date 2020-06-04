import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, IRoomTypeConfigDependencies, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { RoomTypes } from '../../../../definition/IRoom';

export class UnreadRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	public unread: boolean;

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
			identifier: RoomTypes.UNREAD,
			order: 10,
			label: 'Unread',
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
		this.unread = true;
	}

	condition(): boolean {
		return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowUnread');
	}
}
