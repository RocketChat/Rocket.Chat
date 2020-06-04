import { Meteor } from 'meteor/meteor';

import { IRoomTypeConfig, IRoomTypeConfigDependencies, RoomTypeConfig } from '../../../utils/lib/RoomTypeConfig';
import { IUserCommonUtils } from '../../../utils/lib/IUserCommonUtils';
import { RoomTypes } from '../../../../definition/IRoom';

export class FavoriteRoomType extends RoomTypeConfig implements IRoomTypeConfig {
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
			identifier: RoomTypes.FAVORITE,
			order: 20,
			header: 'favorite',
			icon: 'star',
			label: 'Favorites',
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
		return this.settings.get('Favorite_Rooms') && this.UserCommonUtils.getUserPreference(Meteor.userId() as string, 'sidebarShowFavorites');
	}
}
