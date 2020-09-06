import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';

export const streamApps = new Stream(STREAM_NAMES.APPS);
streamApps.allowRead('all');

export const streamImporters = new Stream(STREAM_NAMES.IMPORTERS);
streamImporters.allowRead('all');

export const streamRoles = new Stream(STREAM_NAMES.ROLES);
streamRoles.allowRead('all');

export const streamCannedresponses = new Stream(STREAM_NAMES.CANNED_RESPONSES);
streamCannedresponses.allowRead('all');

export const streamLivechatRoom = new Stream(STREAM_NAMES.LIVECHAT_ROOM);
streamLivechatRoom.allowRead('all');
