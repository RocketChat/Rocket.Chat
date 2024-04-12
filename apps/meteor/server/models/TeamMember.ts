import { registerModel } from '@rocket.chat/models';

import { TeamMemberRaw } from './raw/TeamMember';

registerModel('ITeamMemberModel', new TeamMemberRaw());
