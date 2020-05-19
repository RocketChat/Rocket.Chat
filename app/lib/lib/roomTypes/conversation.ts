import { Meteor } from 'meteor/meteor';

import { ISettingsBase } from '../../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../../models/lib';
import { IAuthorization } from '../../../authorization/lib/IAuthorizationUtils';
import { IRoomTypeConfig, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { ISubscriptionRepository } from '../../../models/lib/ISubscriptionRepository';
import { IRoomCommonUtils } from '../../../utils/lib/IRoomCommonUtils';
import { ICommonUtils } from '../../../utils/lib/ICommonUtils';
import { IRoomTypes } from '../../../utils/lib/RoomTypesCommon';
import { RoomTypes } from '../../../../definition/IRoom';

export class ConversationRoomType extends RoomTypeConfig implements IRoomTypeConfig {
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
			identifier: RoomTypes.CONVERSATION,
			order: 30,
			label: 'Conversations',
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
	}

	condition(): boolean {
		// returns true only if sidebarGroupByType is not set
		return !this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarGroupByType');
	}
}
