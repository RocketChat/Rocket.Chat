import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, IRoomTypeConfigDependencies, RoomTypeConfig } from '../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../utils/lib/IUserCommonUtils';
import { RoomTypes } from '../../../definition/IRoom';

export class DiscussionRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	public customTemplate: string;

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
			identifier: RoomTypes.DISCUSSION,
			order: 25,
			label: 'Discussion',
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

		// we need a custom template in order to have a custom query showing the subscriptions to discussions
		this.customTemplate = 'DiscussionList';
		this.UserCommonUtils = UserCommonUtils;
	}

	condition(): boolean {
		return this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowDiscussion');
	}
}
