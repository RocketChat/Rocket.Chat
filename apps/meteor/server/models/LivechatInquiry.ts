import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { LivechatInquiryRaw } from './raw/LivechatInquiry';

registerModel('ILivechatInquiryModel', new LivechatInquiryRaw(trashCollection));
