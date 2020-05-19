import { commonUtils, roomCommonUtils, roomTypes, userCommonUtils } from '../../utils/client';
import {
	ConversationRoomType,
	DirectMessageRoomType,
	FavoriteRoomType,
	PrivateRoomType,
	PublicRoomType,
	UnreadRoomType,
} from '../lib/roomTypes';
import { settings } from '../../settings/client';
import { Rooms, Subscriptions, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';

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
