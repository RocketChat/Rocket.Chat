import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { LivechatInquiryRawEE } from './raw/LivechatInquiry';

registerModel('ILivechatInquiryModel', new LivechatInquiryRawEE(db));
