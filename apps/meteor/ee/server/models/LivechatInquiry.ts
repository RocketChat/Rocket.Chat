import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { LivechatInquiryRawEE } from './raw/LivechatInquiry';

registerModel('ILivechatInquiryModel', new LivechatInquiryRawEE(trashCollection));
