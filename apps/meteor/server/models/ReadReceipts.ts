import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ReadReceiptsRaw } from './raw/ReadReceipts';

registerModel('IReadReceiptsModel', new ReadReceiptsRaw(db, trashCollection));
