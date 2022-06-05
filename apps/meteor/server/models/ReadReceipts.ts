import { registerModel } from '@rocket.chat/models';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { ReadReceiptsRaw } from './raw/ReadReceipts';

const col = db.collection(`${prefix}read_receipts`);
registerModel('IReadReceiptsModel', new ReadReceiptsRaw(col, trashCollection) as IReadReceiptsModel);
