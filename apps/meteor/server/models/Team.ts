import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { TeamRaw } from './raw/Team';

const col = db.collection(`${prefix}team`);
registerModel('ITeamModel', new TeamRaw(col, trashCollection));
