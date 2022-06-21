import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { PbxEventsRaw } from './raw/PbxEvents';

const col = db.collection('pbx_events');
export const PbxEvents = new PbxEventsRaw(col, trashCollection);
registerModel('IPbxEventsModel', PbxEvents);
