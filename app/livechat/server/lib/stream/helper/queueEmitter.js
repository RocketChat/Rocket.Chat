import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../../authorization/server';
import { LivechatInquiry } from '../../../../../models/server';
import { LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER } from '../../../../lib/stream/constants';

const queueDataStreamer = new Meteor.Streamer(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER);
queueDataStreamer.allowWrite('none');
queueDataStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

export const emitQueueDataEvent = (event, data) => queueDataStreamer.emit(event, data);
