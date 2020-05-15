import { roomTypes, userCommonUtils } from '../../../utils/server';
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

roomTypes.add(new UnreadRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new FavoriteRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new ConversationRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new PublicRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
roomTypes.add(new PrivateRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
roomTypes.add(new DirectMessageRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
