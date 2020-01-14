import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { LivechatInquiry } from '../../../../models/server';
import { OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER } from '../../../lib/stream/constants';

const livechatQueueStreamer = new Meteor.Streamer('livechat-queue-stream');
livechatQueueStreamer.allowWrite('none');
livechatQueueStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

const emitEvent = (event, data) => livechatQueueStreamer.emit(event, data);
const mountDataToEmit = (type, data) => ({ type, ...data });

LivechatInquiry.find({}).observeChanges({
	added(_id, record) {
		if (record && record.department) {
			return emitEvent(`${ OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER }/${ record.department }`, mountDataToEmit('added', { ...record, _id }));
		}
		emitEvent(OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('added', { ...record, _id }));
	},
	changed(_id, record) {
		const isUpdatingDepartment = record && record.department;
		const inquiry = LivechatInquiry.findOneById(_id);
		if (inquiry && !inquiry.department) {
			return emitEvent(OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('changed', inquiry));
		}
		if (isUpdatingDepartment) {
			emitEvent(OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('changed', inquiry));
		}
		return emitEvent(`${ OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER }/${ inquiry.department }`, mountDataToEmit('changed', inquiry));
	},
	removed(_id) {
		const inquiry = LivechatInquiry.trashFindOneById(_id);
		if (inquiry && inquiry.department) {
			return emitEvent(`${ OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER }/${ inquiry.department }`, mountDataToEmit('removed', { _id }));
		}
		emitEvent(OMNICHANNEL_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('removed', { _id }));
	},
});
