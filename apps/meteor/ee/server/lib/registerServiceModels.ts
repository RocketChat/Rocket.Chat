import type { Db } from 'mongodb';
import { registerModel } from '@rocket.chat/models';

import { RolesRaw } from '../../../server/models/raw/Roles';
import { RoomsRaw } from '../../../server/models/raw/Rooms';
import { SettingsRaw } from '../../../server/models/raw/Settings';
import { TeamRaw } from '../../../server/models/raw/Team';
import { TeamMemberRaw } from '../../../server/models/raw/TeamMember';
import { SubscriptionsRaw } from '../../../server/models/raw/Subscriptions';
import { UsersRaw } from '../../../server/models/raw/Users';
import { MessagesRaw } from '../../../server/models/raw/Messages';
import { LivechatInquiryRaw } from '../../../server/models/raw/LivechatInquiry';
import { LivechatDepartmentAgentsRaw } from '../../../server/models/raw/LivechatDepartmentAgents';
import { UsersSessionsRaw } from '../../../server/models/raw/UsersSessions';
import { PermissionsRaw } from '../../../server/models/raw/Permissions';
import { LoginServiceConfigurationRaw } from '../../../server/models/raw/LoginServiceConfiguration';
import { InstanceStatusRaw } from '../../../server/models/raw/InstanceStatus';
import { IntegrationHistoryRaw } from '../../../server/models/raw/IntegrationHistory';
import { IntegrationsRaw } from '../../../server/models/raw/Integrations';
import { EmailInboxRaw } from '../../../server/models/raw/EmailInbox';
import { PbxEventsRaw } from '../../../server/models/raw/PbxEvents';

// TODO add trash param to model instances
export const registerServiceModels = (db: Db): void => {
	registerModel('IRolesModel', () => new RolesRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('ISettingsModel', () => new SettingsRaw(db));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db));
	registerModel('ITeamModel', () => new TeamRaw(db));
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db));
	registerModel('IUsersModel', () => new UsersRaw(db));

	// @ts-ignore-error
	registerModel('IMessagesModel', () => new MessagesRaw(db));

	registerModel('ILivechatInquiryModel', () => new LivechatInquiryRaw(db));
	registerModel('ILivechatDepartmentAgentsModel', () => new LivechatDepartmentAgentsRaw(db));
	registerModel('IUsersSessionsModel', () => new UsersSessionsRaw(db));
	registerModel('IPermissionsModel', () => new PermissionsRaw(db));
	registerModel('ILoginServiceConfigurationModel', () => new LoginServiceConfigurationRaw(db));
	registerModel('IInstanceStatusModel', () => new InstanceStatusRaw(db));
	registerModel('IIntegrationHistoryModel', () => new IntegrationHistoryRaw(db));
	registerModel('IIntegrationsModel', () => new IntegrationsRaw(db));
	registerModel('IEmailInboxModel', () => new EmailInboxRaw(db));
	registerModel('IPbxEventsModel', () => new PbxEventsRaw(db));
};
