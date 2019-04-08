import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatRoomType from '../lib/LivechatRoomType';

RocketChat.roomTypes.add(new LivechatRoomType());
