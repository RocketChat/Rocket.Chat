import { roomTypes } from '../../utils';
import {
	ConversationRoomType,
	DirectMessageRoomType,
	FavoriteRoomType,
	PrivateRoomType,
	PublicRoomType,
	UnreadRoomType,
	NewsfeedRoomType,
} from '../lib/roomTypes';

roomTypes.add(new UnreadRoomType());
roomTypes.add(new FavoriteRoomType());
roomTypes.add(new ConversationRoomType());
roomTypes.add(new PublicRoomType());
roomTypes.add(new PrivateRoomType());
roomTypes.add(new DirectMessageRoomType());
roomTypes.add(new NewsfeedRoomType());
