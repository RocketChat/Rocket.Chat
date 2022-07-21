import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ExportOperationsRaw } from './raw/ExportOperations';

registerModel('IExportOperationsModel', new ExportOperationsRaw(db, trashCollection));
