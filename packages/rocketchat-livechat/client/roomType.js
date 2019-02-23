import { roomTypes } from 'meteor/rocketchat:utils';
import LivechatRoomType from '../lib/LivechatRoomType';

roomTypes.add(new LivechatRoomType());
