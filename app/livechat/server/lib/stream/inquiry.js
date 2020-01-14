import { Meteor } from 'meteor/meteor';

import { LivechatInquiry } from '../../../../models/server';
import { OMNICHANNEL_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';
import { hasPermission } from '../../../../authorization/server';

export const inquiryDataStream = new Meteor.Streamer(OMNICHANNEL_INQUIRY_DATA_STREAM_OBSERVER);

inquiryDataStream.allowWrite('none');

inquiryDataStream.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});

const emitInquiryDataEvent = (id, data) => {
	if (!data) {
		return;
	}

	inquiryDataStream.emit(id, data);
};

LivechatInquiry.on('change', ({ clientAction, id }) => {
	switch (clientAction) {
		case 'inserted':
		case 'updated':
			emitInquiryDataEvent(id, LivechatInquiry.findOneById(id));
			break;

		case 'removed':
			emitInquiryDataEvent(id, { _id: id });
			break;
	}
});
