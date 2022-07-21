import type { Db } from 'mongodb';
import { registerModel } from '@rocket.chat/models';

import { RolesRaw } from '../../../server/models/raw/Roles';
import { RoomsRaw } from '../../../server/models/raw/Rooms';
import { SettingsRaw } from '../../../server/models/raw/Settings';
import { TeamRaw } from '../../../server/models/raw/Team';
import { TeamMemberRaw } from '../../../server/models/raw/TeamMember';
import { SubscriptionsRaw } from '../../../server/models/raw/Subscriptions';
import { UsersRaw } from '../../../server/models/raw/Users';

// TODO add trash param to model instances
export const registerServiceModels = (db: Db): void => {
	registerModel('IRolesModel', () => new RolesRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('ISettingsModel', () => new SettingsRaw(db));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db));
	registerModel('ITeamModel', () => new TeamRaw(db));
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db));
	registerModel('IUsersModel', () => new UsersRaw(db));
};
