import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { UploadsRaw } from './raw/Uploads';

registerModel('IUploadsModel', new UploadsRaw(db, trashCollection));
