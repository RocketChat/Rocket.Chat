import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../../../server/database/trash';
import { db } from '../../../server/database/utils';
import { LivechatInquiryRawEE } from './raw/LivechatInquiry';

registerModel('ILivechatInquiryModel', new LivechatInquiryRawEE(db, trashCollection));
