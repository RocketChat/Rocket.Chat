import { registerModel } from '@rocket.chat/models';
import type { IImportDataModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import ImportDataModel from '../../app/models/server/models/ImportData';
import { ImportDataRaw } from './raw/ImportData';

registerModel('IImportDataModel', new ImportDataRaw(ImportDataModel.model.rawCollection(), trashCollection) as IImportDataModel);
