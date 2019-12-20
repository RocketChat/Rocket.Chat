import { Meteor } from 'meteor/meteor';

import { APIClient } from '../../../../utils/client';
import { getLivechatInquiryCollection } from '../../collections/LivechatInquiry';
import { LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';

const livechatInquiryStreamer = new Meteor.Streamer('livechat-inquiry');

export const initializeLivechatInquiryStream = async (userId) => {
	const collection = getLivechatInquiryCollection();

	const { inquiries } = await APIClient.v1.get('livechat/inquiries.listWithRestrictions');
	(inquiries || []).forEach((inquiry) => collection.upsert({ _id: inquiry._id }, inquiry));
	const { departments } = await APIClient.v1.get(`livechat/agents/${ userId }/departments`);

	const events = {
		added: (inquiry) => collection.insert(inquiry),
		changed: (inquiry) => {
			if (inquiry.status !== 'queued' || (inquiry.department && !departments.map((departament) => departament.departmentId).includes(inquiry.department))) {
				return collection.remove({ _id: inquiry._id });
			}
			delete inquiry.type;
			collection.upsert({ _id: inquiry._id }, inquiry);
		},
		removed: (inquiry) => collection.remove({ _id: inquiry._id }),
	};

	if (departments && Array.isArray(departments) && departments.length) {
		departments.forEach((department) => {
			livechatInquiryStreamer.on(`${ LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER }/${ department.departmentId }`, (inquiry) => events[inquiry.type](inquiry));
		});
	}
	livechatInquiryStreamer.on(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER, (inquiry) => events[inquiry.type](inquiry));
};
