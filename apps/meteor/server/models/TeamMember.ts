import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db } from '../database/utils';
import { TeamMemberRaw } from './raw/TeamMember';

registerModel('ITeamMemberModel', new TeamMemberRaw(db, trashCollection));
