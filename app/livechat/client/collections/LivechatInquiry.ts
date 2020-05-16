import { Mongo } from 'meteor/mongo';

import { ILivechatInquiryRepository } from '../../../models/lib/ILivechatInquiryRepository';

export const LivechatInquiry: ILivechatInquiryRepository = new Mongo.Collection(null);
