import { registerModel } from '@rocket.chat/models';
import type { IExportOperationsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { ExportOperationsRaw } from './raw/ExportOperations';

const col = db.collection(`${prefix}export_operations`);
registerModel('IExportOperationsModel', new ExportOperationsRaw(col, trashCollection) as IExportOperationsModel);
