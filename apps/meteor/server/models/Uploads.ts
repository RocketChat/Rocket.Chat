import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { UploadsRaw } from './raw/Uploads';

const col = db.collection(`${prefix}uploads`);
registerModel('IUploadsModel', new UploadsRaw(col, trashCollection));
