import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';
import { IRoomCommonUtils } from '../../../utils/lib/IRoomCommonUtils';
import { ICommonUtils } from '../../../utils/lib/ICommonUtils';
import { IRoomTypes } from '../../../utils/lib/RoomTypesCommon';

export class UnreadRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	public unread: boolean;

	private UserCommonUtils: IUserCommonUtils;

	constructor(settings: ISettingsBase,
		Users: IUsersRepository,
		Rooms: IRoomsRepository,
		Subscriptions: ISubscriptionRepository,
		AuthorizationUtils: IAuthorization,
		UserCommonUtils: IUserCommonUtils,
		RoomCommonUtils: IRoomCommonUtils,
		CommonUtils: ICommonUtils,
		RoomTypesCommon: IRoomTypes) {
		super({
			identifier: 'unread',
			order: 10,
			label: 'Unread',
		},
		settings,
		Users,
		Rooms,
		Subscriptions,
		AuthorizationUtils,
		RoomCommonUtils,
		CommonUtils,
		RoomTypesCommon);
		this.UserCommonUtils = UserCommonUtils;
		this.unread = true;
	}

	condition(): boolean {
		return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowUnread');
	}
}
