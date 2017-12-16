import {
	ChannelsRoomType,
	ConversationRoomType,
	DirectMessageRoomType,
	FavoriteRoomType,
	PrivateRoomType,
	PublicRoomType,
	UnreadRoomType
} from '../lib/roomTypes';

RocketChat.roomTypes.add(new UnreadRoomType());
RocketChat.roomTypes.add(new FavoriteRoomType());
RocketChat.roomTypes.add(new ConversationRoomType());
RocketChat.roomTypes.add(new ChannelsRoomType());
RocketChat.roomTypes.add(new PublicRoomType());
RocketChat.roomTypes.add(new PrivateRoomType());
RocketChat.roomTypes.add(new DirectMessageRoomType());
