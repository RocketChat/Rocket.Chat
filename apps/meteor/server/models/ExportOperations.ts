import { registerModel } from '@rocket.chat/models';

import { ExportOperationsRaw } from './raw/ExportOperations';

registerModel('IExportOperationsModel', new ExportOperationsRaw());
