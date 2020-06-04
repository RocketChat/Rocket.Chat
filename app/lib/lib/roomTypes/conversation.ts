import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, IRoomTypeConfigDependencies, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { RoomTypes } from '../../../../definition/IRoom';

export class ConversationRoomType extends RoomTypeConfig implements IRoomTypeConfig {
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
			identifier: RoomTypes.CONVERSATION,
			order: 30,
			label: 'Conversations',
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

	condition(): boolean {
		// returns true only if sidebarGroupByType is not set
		return !this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarGroupByType');
	}
}
