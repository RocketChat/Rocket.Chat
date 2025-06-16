import { registerModel } from '@rocket.chat/models';

import { LivechatInquiryRawEE } from './raw/LivechatInquiry';
import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';

registerModel('ILivechatInquiryModel', new LivechatInquiryRawEE(db, trashCollection));
