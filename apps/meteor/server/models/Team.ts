import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { TeamRaw } from './raw/Team';

registerModel('ITeamModel', new TeamRaw(db, trashCollection));
