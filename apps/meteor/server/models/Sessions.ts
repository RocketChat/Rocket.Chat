import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { SessionsRaw } from './raw/Sessions';
import { readSecondaryPreferred } from '../database/readSecondaryPreferred';

const col = db.collection(`${prefix}sessions`);
const colSecondary = db.collection(`${prefix}sessions`, { readPreference: readSecondaryPreferred(db) });
registerModel('ISessionsModel', new SessionsRaw(col, colSecondary, trashCollection));
