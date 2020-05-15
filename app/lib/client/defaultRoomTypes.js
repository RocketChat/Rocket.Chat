import { roomTypes } from '../../utils/client';
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
import { userCommonUtils } from '../../utils/client';

roomTypes.add(new UnreadRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new FavoriteRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new ConversationRoomType(settings, Users, Rooms, AuthorizationUtils, userCommonUtils));
roomTypes.add(new PublicRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
roomTypes.add(new PrivateRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
roomTypes.add(new DirectMessageRoomType(settings, Users, Rooms, AuthorizationUtils, Subscriptions, userCommonUtils));
