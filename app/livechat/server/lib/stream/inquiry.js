import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { LivechatInquiry } from '../../../../models/server';
import { LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';

const livechatInquiryStreamer = new Meteor.Streamer('livechat-inquiry');
livechatInquiryStreamer.allowWrite('none');
livechatInquiryStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

const emitEvent = (event, data) => livechatInquiryStreamer.emit(event, data);
const mountDataToEmit = (type, data) => ({ type, ...data });

LivechatInquiry.find({}).observeChanges({
	added(_id, record) {
		if (record && record.department) {
			return emitEvent(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ record.department }`, mountDataToEmit('added', { ...record, _id }));
		}
		emitEvent(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, mountDataToEmit('added', { ...record, _id }));
	},
	changed(_id, record) {
		const isUpdatingDepartment = record && record.department;
		const inquiry = LivechatInquiry.findOneById(_id);
		if (inquiry && !inquiry.department) {
			return emitEvent(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, mountDataToEmit('changed', inquiry));
		}
		if (isUpdatingDepartment) {
			emitEvent(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, mountDataToEmit('changed', inquiry));
		}
		return emitEvent(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ inquiry.department }`, mountDataToEmit('changed', inquiry));
	},
	removed(_id) {
		const inquiry = LivechatInquiry.trashFindOneById(_id);
		if (inquiry && inquiry.department) {
			return emitEvent(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ inquiry.department }`, mountDataToEmit('removed', { _id }));
		}
		emitEvent(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, mountDataToEmit('removed', { _id }));
	},
});
