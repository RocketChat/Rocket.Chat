import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { ImportDataRaw } from './raw/ImportData';

registerModel('IImportDataModel', new ImportDataRaw(db, trashCollection));
