import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';

export const streamRoom = new Stream(STREAM_NAMES.NOTIFY_ROOM);

streamRoom.allowWrite('none');

// TODO canAccessRoom?
streamRoom.allowRead('all');
