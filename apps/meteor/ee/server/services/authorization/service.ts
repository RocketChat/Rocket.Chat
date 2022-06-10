import { registerModel } from '@rocket.chat/models';
import type {
	IRolesModel,
	IRoomsModel,
	ISettingsModel,
	ISubscriptionsModel,
	ITeamMemberModel,
	ITeamModel,
	IUsersModel,
} from '@rocket.chat/model-typings';

import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Authorization } from '../../../../server/services/authorization/service';
import { SubscriptionsRaw } from '../../../../server/models/raw/Subscriptions';
import { SettingsRaw } from '../../../../server/models/raw/Settings';
import { RoomsRaw } from '../../../../server/models/raw/Rooms';
import { TeamMemberRaw } from '../../../../server/models/raw/TeamMember';
import { TeamRaw } from '../../../../server/models/raw/Team';
import { RolesRaw } from '../../../../server/models/raw/Roles';
import { UsersRaw } from '../../../../server/models/raw/Users';
import { getConnection } from '../mongo';

getConnection().then((db) => {
	registerModel('ISubscriptionsModel', new SubscriptionsRaw(db.collection('rocketchat_subscription')) as ISubscriptionsModel);
	registerModel('ISettingsModel', new SettingsRaw(db.collection('rocketchat_settings')) as ISettingsModel);
	registerModel('IRoomsModel', new RoomsRaw(db.collection('rocketchat_room')) as IRoomsModel);
	registerModel('ITeamMemberModel', new TeamMemberRaw(db.collection('rocketchat_team_member')) as ITeamMemberModel);
	registerModel('ITeamModel', new TeamRaw(db.collection('rocketchat_team')) as ITeamModel);
	registerModel('IRolesModel', new RolesRaw(db.collection('rocketchat_roles')) as IRolesModel);
	registerModel('IUsersModel', new UsersRaw(db.collection('users')) as IUsersModel);

	api.registerService(new Authorization(db));
});
