import { commonUtils, roomCommonUtils, roomTypes, userCommonUtils } from '../../utils/client';
import {
	ConversationRoomType,
	DirectMessageRoomType,
	FavoriteRoomType,
	PrivateRoomType,
	PublicRoomType,
	UnreadRoomType,
} from '../lib/roomTypes/index';
import { settings } from '../../settings/client';
import { Rooms, Subscriptions, Users } from '../../models/client';
import { AuthorizationUtils } from '../../authorization/client';


roomTypes.add(new UnreadRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
roomTypes.add(new FavoriteRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
roomTypes.add(new ConversationRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
roomTypes.add(new PublicRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
roomTypes.add(new PrivateRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
roomTypes.add(new DirectMessageRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils, commonUtils, roomTypes));
