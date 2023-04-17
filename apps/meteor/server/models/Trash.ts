import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { TrashRaw } from './raw/Trash';

registerModel('ITrashModel', new TrashRaw(db));
