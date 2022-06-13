import type { Db } from 'mongodb';
import type {
	IRolesModel,
	IRoomsModel,
	ISettingsModel,
	ISubscriptionsModel,
	ITeamModel,
	ITeamMemberModel,
	IUsersModel,
} from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { RolesRaw } from '../../../server/models/raw/Roles';
import { RoomsRaw } from '../../../server/models/raw/Rooms';
import { SettingsRaw } from '../../../server/models/raw/Settings';
import { TeamRaw } from '../../../server/models/raw/Team';
import { TeamMemberRaw } from '../../../server/models/raw/TeamMember';
import { SubscriptionsRaw } from '../../../server/models/raw/Subscriptions';
import { UsersRaw } from '../../../server/models/raw/Users';

export const registerServiceModels = (db: Db): void => {
	registerModel('IRolesModel', () => new RolesRaw(db.collection('rocketchat_roles')) as IRolesModel);
	registerModel('IRoomsModel', () => new RoomsRaw(db.collection('rocketchat_room')) as IRoomsModel);
	registerModel('ISettingsModel', () => new SettingsRaw(db.collection('rocketchat_settings')) as ISettingsModel);
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db.collection('rocketchat_subscription')) as ISubscriptionsModel);
	registerModel('ITeamModel', () => new TeamRaw(db.collection('rocketchat_team')) as ITeamModel);
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db.collection('rocketchat_team_member')) as ITeamMemberModel);
	registerModel('IUsersModel', () => new UsersRaw(db.collection('users')) as IUsersModel);
};
