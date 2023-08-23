import type {
	ILivechatDepartmentAgents,
	ILivechatInquiryRecord,
	ISetting,
	ISubscription,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';
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
export function registerServiceModels(db: Db, trash?: Collection<RocketChatRecordDeleted<any>>): void {
	registerModel('IRolesModel', () => new RolesRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('ISettingsModel', () => new SettingsRaw(db, trash as Collection<RocketChatRecordDeleted<ISetting>>));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db, trash as Collection<RocketChatRecordDeleted<ISubscription>>));
	registerModel('ITeamModel', () => new TeamRaw(db));
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db));
	registerModel('IUsersModel', () => new UsersRaw(db));

	registerModel('IMessagesModel', () => new MessagesRaw(db));

	registerModel(
		'ILivechatInquiryModel',
		() => new LivechatInquiryRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>),
	);
	registerModel(
		'ILivechatDepartmentAgentsModel',
		() => new LivechatDepartmentAgentsRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>),
	);
	registerModel('IUsersSessionsModel', () => new UsersSessionsRaw(db));
	registerModel('IPermissionsModel', () => new PermissionsRaw(db));
	registerModel('ILoginServiceConfigurationModel', () => new LoginServiceConfigurationRaw(db));
	registerModel('IInstanceStatusModel', () => new InstanceStatusRaw(db));
	registerModel('IIntegrationHistoryModel', () => new IntegrationHistoryRaw(db));
	registerModel('IIntegrationsModel', () => new IntegrationsRaw(db));
	registerModel('IEmailInboxModel', () => new EmailInboxRaw(db));
	registerModel('IPbxEventsModel', () => new PbxEventsRaw(db));
	registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(db));
	registerModel('ILivechatRoomsModel', () => new LivechatRoomsRaw(db));
	registerModel('IUploadsModel', () => new UploadsRaw(db));
	registerModel('ILivechatVisitorsModel', () => new LivechatVisitorsRaw(db));
}
