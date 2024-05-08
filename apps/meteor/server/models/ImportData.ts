import { registerModel } from '@rocket.chat/models';

import { ImportDataRaw } from './raw/ImportData';

registerModel('IImportDataModel', new ImportDataRaw());
