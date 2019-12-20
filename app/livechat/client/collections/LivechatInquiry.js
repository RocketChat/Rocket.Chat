import { Mongo } from 'meteor/mongo';

import { settings } from '../../../settings/client';

const LivechatInquiryStreaming = new Mongo.Collection(null);
const LivechatInquirySubscription = new Mongo.Collection('rocketchat_livechat_inquiry');

export const getLivechatInquiryCollection = () => (settings.get('Livechat_enable_inquiry_fetch_by_stream') ? LivechatInquiryStreaming : LivechatInquirySubscription);
