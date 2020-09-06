import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';

export const notifyLogged = new Stream(STREAM_NAMES.NOTIFY_LOGGED);

notifyLogged.allowWrite('none');
notifyLogged.allowRead('logged');
