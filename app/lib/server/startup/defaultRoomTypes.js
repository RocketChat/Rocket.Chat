import { commonUtils, roomCommonUtils, roomTypes, userCommonUtils } from '../../../utils/server';
import {
	ConversationRoomType,
	DirectMessageRoomType,
	FavoriteRoomType,
	PrivateRoomType,
	PublicRoomType,
	UnreadRoomType,
} from '../../lib/roomTypes';
import { settings } from '../../../settings/server';
import { Rooms, Subscriptions, Users } from '../../../models/server';
import { AuthorizationUtils } from '../../../authorization/server';

const dependencies = {
	settings,
	Users,
	Rooms,
	Subscriptions,
	AuthorizationUtils,
	RoomCommonUtils: roomCommonUtils,
	CommonUtils: commonUtils,
	RoomTypesCommon: roomTypes,
};

roomTypes.add(new UnreadRoomType(dependencies, userCommonUtils));
roomTypes.add(new FavoriteRoomType(dependencies, userCommonUtils));
roomTypes.add(new ConversationRoomType(dependencies, userCommonUtils));
roomTypes.add(new PublicRoomType(dependencies, userCommonUtils));
roomTypes.add(new PrivateRoomType(dependencies, userCommonUtils));
roomTypes.add(new DirectMessageRoomType(dependencies, userCommonUtils));
