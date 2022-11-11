import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { LivechatInquiryRaw } from './raw/LivechatInquiry';

registerModel('ILivechatInquiryModel', new LivechatInquiryRaw(db, trashCollection));
