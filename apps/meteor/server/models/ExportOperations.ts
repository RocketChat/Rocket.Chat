import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { ExportOperationsRaw } from './raw/ExportOperations';

const col = db.collection(`${prefix}export_operations`);
registerModel('IExportOperationsModel', new ExportOperationsRaw(col, trashCollection));
