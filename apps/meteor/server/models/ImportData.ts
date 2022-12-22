import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ImportDataRaw } from './raw/ImportData';

registerModel('IImportDataModel', new ImportDataRaw(db));
