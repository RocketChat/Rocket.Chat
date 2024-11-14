import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

export const LivechatInquiry = new Mongo.Collection<ILivechatInquiryRecord & { alert?: boolean }>(null);
