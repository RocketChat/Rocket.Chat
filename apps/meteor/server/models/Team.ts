import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { TeamRaw } from './raw/Team';

registerModel('ITeamModel', new TeamRaw(db));
