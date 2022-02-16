import { roomTypes } from '../../utils';
import LivechatRoomType from '../lib/LivechatRoomType';
import VoipRoomType from '../lib/VoipRoomType';

roomTypes.add(new LivechatRoomType());
roomTypes.add(new VoipRoomType());
