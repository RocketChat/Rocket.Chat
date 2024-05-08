import { registerModel } from '@rocket.chat/models';

import { TeamRaw } from './raw/Team';

registerModel('ITeamModel', new TeamRaw());
