import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';

export const streamAll = new Stream(STREAM_NAMES.NOTIFY_ALL);
streamAll.allowRead('all');
