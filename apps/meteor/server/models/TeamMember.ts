import { registerModel } from '@rocket.chat/models';
import type { ITeamMemberModel } from '@rocket.chat/model-typings';

import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';
import { TeamMemberRaw } from './raw/TeamMember';

const col = db.collection(`${prefix}team_member`);
registerModel('ITeamMemberModel', new TeamMemberRaw(col, trashCollection) as ITeamMemberModel);
