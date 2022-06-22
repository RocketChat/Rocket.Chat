import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { PbxEventsRaw } from './raw/PbxEvents';

registerModel('IPbxEventsModel', new PbxEventsRaw(db, trashCollection));
