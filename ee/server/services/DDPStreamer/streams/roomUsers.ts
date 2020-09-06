// mangola stream detected???
import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';

export const streamRoomUsers = new Stream(STREAM_NAMES.NOTIFY_ROOM_USERS);
streamRoomUsers.allowRead('none');
