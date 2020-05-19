import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../utils/client';
import { IRoomTypeConfig, IRoomTypeConfigDependencies, RoomTypeConfig } from '../../utils/lib/RoomTypeConfig';
import { settings } from '../../settings/client';
import { Rooms, Subscriptions, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';
import { commonUtils, roomCommonUtils } from '../../utils/client/factory';
import { RoomTypes } from '../../../definition/IRoom';

class TokenPassRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	public customTemplate: string;

	constructor({
		settings,
		Users,
		Rooms,
		Subscriptions,
		AuthorizationUtils,
		RoomCommonUtils,
		CommonUtils,
		RoomTypesCommon,
	}: IRoomTypeConfigDependencies) {
		super({
			identifier: RoomTypes.TOKENPASS,
			order: 1,
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

		this.customTemplate = 'tokenChannelsList';
	}

	condition(): boolean {
		const user = this.Users.findOneById(Meteor.userId() as string, { fields: { 'services.tokenpass': 1 } });
		const hasTokenpass = !!(user && user.services && user.services.tokenpass);

		return hasTokenpass;
	}
}

roomTypes.add(new TokenPassRoomType({
	settings,
	Users,
	Rooms,
	Subscriptions,
	AuthorizationUtils,
	RoomCommonUtils: roomCommonUtils,
	CommonUtils: commonUtils,
	RoomTypesCommon: roomTypes,
}));
