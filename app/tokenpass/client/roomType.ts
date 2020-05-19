import { Meteor } from 'meteor/meteor';

import { roomTypes } from '../../utils/client';
import { IRoomTypeConfig, RoomTypeConfig } from '../../utils/lib/RoomTypeConfig';
import { ISettingsBase } from '../../settings/lib/settings';
import { IRoomsRepository, IUsersRepository } from '../../models/lib';
import { IAuthorization } from '../../authorization/lib/IAuthorizationUtils';
import { settings } from '../../settings/client';
import { Rooms, Subscriptions, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';
import { ISubscriptionRepository } from '../../models/lib/ISubscriptionRepository';
import { IRoomCommonUtils } from '../../utils/lib/IRoomCommonUtils';
import { ICommonUtils } from '../../utils/lib/ICommonUtils';
import { commonUtils, roomCommonUtils } from '../../utils/client/factory';
import { IRoomTypes } from '../../utils/lib/RoomTypesCommon';
import { RoomTypes } from '../../../definition/IRoom';

class TokenPassRoomType extends RoomTypeConfig implements IRoomTypeConfig {
	public customTemplate: string;

	constructor(settings: ISettingsBase,
		Users: IUsersRepository,
		Rooms: IRoomsRepository,
		Subscriptions: ISubscriptionRepository,
		AuthorizationUtils: IAuthorization,
		RoomCommonUtils: IRoomCommonUtils,
		CommonUtils: ICommonUtils,
		RoomTypesCommon: IRoomTypes) {
		super({
			identifier: RoomTypes.TOKENPASS,
			order: 1,
		},
		settings,
		Users,
		Rooms,
		Subscriptions,
		AuthorizationUtils,
		RoomCommonUtils,
		CommonUtils,
		RoomTypesCommon);

		this.customTemplate = 'tokenChannelsList';
	}

	condition(): boolean {
		const user = this.Users.findOneById(Meteor.userId() as string, { fields: { 'services.tokenpass': 1 } });
		const hasTokenpass = !!(user && user.services && user.services.tokenpass);

		return hasTokenpass;
	}
}

roomTypes.add(new TokenPassRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, roomCommonUtils, commonUtils, roomTypes));
