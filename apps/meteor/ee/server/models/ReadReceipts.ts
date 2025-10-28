import { registerModel } from '@rocket.chat/models';

import { ReadReceiptsRaw } from './raw/ReadReceipts';
import { db } from '../../../server/database/utils';

registerModel('IReadReceiptsModel', new ReadReceiptsRaw(db));
