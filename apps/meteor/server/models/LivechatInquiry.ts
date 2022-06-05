import { registerModel } from '@rocket.chat/models';
import type { ILivechatInquiryModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import MeteorModel from '../../app/models/server/models/LivechatInquiry';
import { LivechatInquiryRaw } from './raw/LivechatInquiry';

const col = MeteorModel.model.rawCollection();
export const LivechatInquiry = new LivechatInquiryRaw(col, trashCollection);
registerModel('ILivechatInquiryModel', LivechatInquiry as ILivechatInquiryModel);
