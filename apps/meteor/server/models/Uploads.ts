import { registerModel } from '@rocket.chat/models';
import type { IUploadsModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { UploadsRaw } from './raw/Uploads';

const col = db.collection(`${prefix}uploads`);
registerModel('IUploadsModel', new UploadsRaw(col, trashCollection) as IUploadsModel);
