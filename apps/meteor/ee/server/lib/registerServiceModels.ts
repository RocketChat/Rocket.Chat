import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import { registerModel, db, trash } from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';

import { EmailInboxRaw } from '../../../server/models/raw/EmailInbox';
import { InstanceStatusRaw } from '../../../server/models/raw/InstanceStatus';
import { IntegrationHistoryRaw } from '../../../server/models/raw/IntegrationHistory';
import { IntegrationsRaw } from '../../../server/models/raw/Integrations';
import { LivechatDepartmentAgentsRaw } from '../../../server/models/raw/LivechatDepartmentAgents';
import { LivechatInquiryRaw } from '../../../server/models/raw/LivechatInquiry';
import { LivechatRoomsRaw } from '../../../server/models/raw/LivechatRooms';
import { LivechatVisitorsRaw } from '../../../server/models/raw/LivechatVisitors';
import { LoginServiceConfigurationRaw } from '../../../server/models/raw/LoginServiceConfiguration';
import { MessagesRaw } from '../../../server/models/raw/Messages';
import { PbxEventsRaw } from '../../../server/models/raw/PbxEvents';
import { PermissionsRaw } from '../../../server/models/raw/Permissions';
import { RolesRaw } from '../../../server/models/raw/Roles';
import { RoomsRaw } from '../../../server/models/raw/Rooms';
import { SettingsRaw } from '../../../server/models/raw/Settings';
import { SubscriptionsRaw } from '../../../server/models/raw/Subscriptions';
import { TeamRaw } from '../../../server/models/raw/Team';
import { TeamMemberRaw } from '../../../server/models/raw/TeamMember';
import { UploadsRaw } from '../../../server/models/raw/Uploads';
import { UsersRaw } from '../../../server/models/raw/Users';
import { UsersSessionsRaw } from '../../../server/models/raw/UsersSessions';
import { LivechatPriorityRaw } from '../models/raw/LivechatPriority';

// TODO add trash param to appropiate model instances
export function registerServiceModels(mongoDatabase: Db, trashCollection?: Collection<RocketChatRecordDeleted<any>>): void {
	db.register(mongoDatabase);

	if (trashCollection) {
		trash.register(trashCollection);
	}

	registerModel('IRolesModel', () => new RolesRaw());
	registerModel('IRoomsModel', () => new RoomsRaw());
	registerModel('ISettingsModel', () => new SettingsRaw());
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw());
	registerModel('ITeamModel', () => new TeamRaw());
	registerModel('ITeamMemberModel', () => new TeamMemberRaw());
	registerModel('IUsersModel', () => new UsersRaw());

	registerModel('IMessagesModel', () => new MessagesRaw());

	registerModel('ILivechatInquiryModel', () => new LivechatInquiryRaw());
	registerModel('ILivechatDepartmentAgentsModel', () => new LivechatDepartmentAgentsRaw());
	registerModel('IUsersSessionsModel', () => new UsersSessionsRaw());
	registerModel('IPermissionsModel', () => new PermissionsRaw());
	registerModel('ILoginServiceConfigurationModel', () => new LoginServiceConfigurationRaw());
	registerModel('IInstanceStatusModel', () => new InstanceStatusRaw());
	registerModel('IIntegrationHistoryModel', () => new IntegrationHistoryRaw());
	registerModel('IIntegrationsModel', () => new IntegrationsRaw());
	registerModel('IEmailInboxModel', () => new EmailInboxRaw());
	registerModel('IPbxEventsModel', () => new PbxEventsRaw());
	registerModel('ILivechatPriorityModel', new LivechatPriorityRaw());
	registerModel('ILivechatRoomsModel', () => new LivechatRoomsRaw());
	registerModel('IUploadsModel', () => new UploadsRaw());
	registerModel('ILivechatVisitorsModel', () => new LivechatVisitorsRaw());
}
