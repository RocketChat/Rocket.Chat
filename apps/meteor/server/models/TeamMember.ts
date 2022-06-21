import { registerModel } from '@rocket.chat/models';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { TeamMemberRaw } from './raw/TeamMember';

const col = db.collection(`${prefix}team_member`);
registerModel('ITeamMemberModel', new TeamMemberRaw(col, trashCollection));
