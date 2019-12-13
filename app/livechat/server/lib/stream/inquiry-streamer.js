import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../../authorization/server';

export const livechatInquiryStreamer = new Meteor.Streamer('livechat-inquiry');
livechatInquiryStreamer.allowWrite('none');
livechatInquiryStreamer.allowRead(function() {
	return this.userId ? hasPermission(this.userId, 'view-l-room') : false;
});
