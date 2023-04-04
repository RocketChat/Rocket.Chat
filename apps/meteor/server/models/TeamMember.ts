import { registerModel } from '@rocket.chat/models';

import { db } from '../database/utils';
import { TeamMemberRaw } from './raw/TeamMember';

registerModel('ITeamMemberModel', new TeamMemberRaw(db));
