import { Mongo } from 'meteor/mongo';

import { settings } from '../../../settings/client';

let collection;
export const getLivechatInquiryCollection = () => {
	if (!collection) {
		collection = new Mongo.Collection(settings.get('Livechat_enable_inquiry_fetch_by_stream') ? null : 'rocketchat_livechat_inquiry');
	}
	return collection;
};
