import { roomCommonUtils, roomTypes, userCommonUtils } from '../../../utils/server';
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

roomTypes.add(new UnreadRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils));
roomTypes.add(new FavoriteRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils));
roomTypes.add(new ConversationRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils));
roomTypes.add(new PublicRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils));
roomTypes.add(new PrivateRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils));
roomTypes.add(new DirectMessageRoomType(settings, Users, Rooms, Subscriptions, AuthorizationUtils, userCommonUtils, roomCommonUtils));
