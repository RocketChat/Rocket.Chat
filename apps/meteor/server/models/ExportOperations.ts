import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { ExportOperationsRaw } from './raw/ExportOperations';

registerModel('IExportOperationsModel', new ExportOperationsRaw(db));
