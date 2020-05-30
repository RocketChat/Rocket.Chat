import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';
import { LivechatInquiry } from '../../../../models/server';
import { LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER } from '../../../lib/stream/constants';
import { RoutingManager } from '../RoutingManager';

const queueDataStreamer = new Meteor.Streamer(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER);
queueDataStreamer.allowWrite('none');
queueDataStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

const emitQueueDataEvent = (event, data) => queueDataStreamer.emitWithoutBroadcast(event, data);
const mountDataToEmit = (type, data) => ({ type, ...data });

LivechatInquiry.on('change', ({ clientAction, id: _id, data: record }) => {
	if (RoutingManager.getConfig().autoAssignAgent) {
		return;
	}

	switch (clientAction) {
		case 'inserted':
			emitQueueDataEvent(_id, { ...record, clientAction });
			if (record && record.department) {
				return emitQueueDataEvent(`department/${ record.department }`, mountDataToEmit('added', record));
			}
			emitQueueDataEvent('public', mountDataToEmit('added', record));
			break;
		case 'updated':
			const isUpdatingDepartment = record && record.department;
			const updatedRecord = LivechatInquiry.findOneById(_id);
			emitQueueDataEvent(_id, { ...updatedRecord, clientAction });
			if (updatedRecord && !updatedRecord.department) {
				return emitQueueDataEvent('public', mountDataToEmit('changed', updatedRecord));
			}
			if (isUpdatingDepartment) {
				emitQueueDataEvent('public', mountDataToEmit('changed', updatedRecord));
			}
			emitQueueDataEvent(`department/${ updatedRecord.department }`, mountDataToEmit('changed', updatedRecord));
			break;

		case 'removed':
			const removedRecord = LivechatInquiry.trashFindOneById(_id);
			emitQueueDataEvent(_id, { _id, clientAction });
			if (removedRecord && removedRecord.department) {
				return emitQueueDataEvent(`department/${ removedRecord.department }`, mountDataToEmit('removed', { _id }));
			}
			emitQueueDataEvent('public', mountDataToEmit('removed', { _id }));
			break;
	}
});
