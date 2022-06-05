import type { ISmarshHistory } from '@rocket.chat/core-typings';
import type { ISmarshHistoryModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class SmarshHistory extends ModelClass<ISmarshHistory> implements ISmarshHistoryModel {}

const col = db.collection(`${prefix}smarsh_history`);
registerModel('ISmarshHistoryModel', new SmarshHistory(col, trashCollection) as ISmarshHistoryModel);
