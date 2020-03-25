import { LivechatInquiry } from '../../../../models/server';
import { LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER } from '../../../lib/stream/constants';

const queueDataStreamer = new Meteor.Streamer(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER);
queueDataStreamer.allowWrite('none');
queueDataStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

const emitQueueDataEvent = (event, data) => queueDataStreamer.emit(event, data);
const mountDataToEmit = (type, data) => ({ type, ...data });

LivechatInquiry.on('change', ({ clientAction, id: _id, data: record }) => {
	switch (clientAction) {
		case 'inserted':
			if (record && record.department) {
				return emitQueueDataEvent(`${ LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER }/${ record.department }`, mountDataToEmit('added', { ...record, _id }));
			}
			emitQueueDataEvent(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('added', { ...record, _id }));
			emitQueueDataEvent(_id, LivechatInquiry.findOneById(_id));
			break;
		case 'updated':
			const isUpdatingDepartment = record && record.department;
			const updatedRecord = LivechatInquiry.findOneById(_id);
			if (updatedRecord && !updatedRecord.department) {
				return emitQueueDataEvent(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('changed', updatedRecord));
			}
			if (isUpdatingDepartment) {
				emitQueueDataEvent(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('changed', updatedRecord));
			}
			emitQueueDataEvent(`${ LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER }/${ updatedRecord.department }`, mountDataToEmit('changed', updatedRecord));
			emitQueueDataEvent(_id, updatedRecord);
			break;

		case 'removed':
			const removedRecord = LivechatInquiry.trashFindOneById(_id);
			if (removedRecord && removedRecord.department) {
				return emitQueueDataEvent(`${ LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER }/${ removedRecord.department }`, mountDataToEmit('removed', { _id }));
			}
			emitQueueDataEvent(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER, mountDataToEmit('removed', { _id }));
			emitQueueDataEvent(_id, { _id });
			break;
	}
});
