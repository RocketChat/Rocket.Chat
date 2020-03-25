import { Meteor } from 'meteor/meteor';

import { LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER } from '../../../../lib/stream/constants';
import { hasPermission } from '../../../../../authorization/server';

const inquiryDataStream = new Meteor.Streamer(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER);
inquiryDataStream.allowWrite('none');
inquiryDataStream.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

export const emitInquiryDataEvent = (id, data) => {
	if (!data) {
		return;
	}

	inquiryDataStream.emit(id, data);
};
