import { registerModel } from '@rocket.chat/models';

import { db } from '../../../server/database/utils';
import { ReadReceiptsRaw } from './raw/ReadReceipts';

registerModel('IReadReceiptsModel', new ReadReceiptsRaw(db));
