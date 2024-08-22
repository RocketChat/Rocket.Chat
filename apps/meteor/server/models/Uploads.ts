import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { UploadsRaw } from './raw/Uploads';

registerModel('IUploadsModel', new UploadsRaw(db));
