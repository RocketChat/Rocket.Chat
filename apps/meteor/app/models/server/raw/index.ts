import { MongoInternals } from 'meteor/mongo';

import { AvatarsRaw } from './Avatars';
import { AnalyticsRaw } from './Analytics';
import { api } from '../../../../server/sdk/api';
import { BaseDbWatch, trash } from '../models/_BaseDb';
import { CredentialTokensRaw } from './CredentialTokens';
import { CustomSoundsRaw } from './CustomSounds';
import { CustomUserStatusRaw } from './CustomUserStatus';
import { EmailInboxRaw } from './EmailInbox';
import { EmailMessageHistoryRaw } from './EmailMessageHistory';
import { EmojiCustomRaw } from './EmojiCustom';
import { ExportOperationsRaw } from './ExportOperations';
import { FederationKeysRaw } from './FederationKeys';
import { FederationServersRaw } from './FederationServers';
import { ImportDataRaw } from './ImportData';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';
import { InstanceStatusRaw } from './InstanceStatus';
import { IntegrationHistoryRaw } from './IntegrationHistory';
import { IntegrationsRaw } from './Integrations';
import { InvitesRaw } from './Invites';
import { LivechatAgentActivityRaw } from './LivechatAgentActivity';
import { LivechatBusinessHoursRaw } from './LivechatBusinessHours';
import { LivechatCustomFieldRaw } from './LivechatCustomField';
import { LivechatDepartmentAgentsRaw } from './LivechatDepartmentAgents';
import { LivechatDepartmentRaw } from './LivechatDepartment';
import { LivechatInquiryRaw } from './LivechatInquiry';
import { LivechatRoomsRaw } from './LivechatRooms';
import { LivechatTriggerRaw } from './LivechatTrigger';
import { LivechatVisitorsRaw } from './LivechatVisitors';
import { LoginServiceConfigurationRaw } from './LoginServiceConfiguration';
import { MessagesRaw } from './Messages';
import { NotificationQueueRaw } from './NotificationQueue';
import { OAuthAppsRaw } from './OAuthApps';
import { OEmbedCacheRaw } from './OEmbedCache';
import { OmnichannelQueueRaw } from './OmnichannelQueue';
import { PermissionsRaw } from './Permissions';
import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { ReadReceiptsRaw } from './ReadReceipts';
import { ReportsRaw } from './Reports';
import { RolesRaw } from './Roles';
import { RoomsRaw } from './Rooms';
import { ServerEventsRaw } from './ServerEvents';
import { SessionsRaw } from './Sessions';
import { SettingsRaw } from './Settings';
import { SmarshHistoryRaw } from './SmarshHistory';
import { StatisticsRaw } from './Statistics';
import { SubscriptionsRaw } from './Subscriptions';
import { UsersRaw } from './Users';
import { UsersSessionsRaw } from './UsersSessions';
import { UserDataFilesRaw } from './UserDataFiles';
import { UploadsRaw } from './Uploads';
import { WebdavAccountsRaw } from './WebdavAccounts';
import { VoipRoomsRaw } from './VoipRooms';
import ImportDataModel from '../models/ImportData';
import LivechatBusinessHoursModel from '../models/LivechatBusinessHours';
import LivechatCustomFieldModel from '../models/LivechatCustomField';
import LivechatDepartmentAgentsModel from '../models/LivechatDepartmentAgents';
import LivechatDepartmentModel from '../models/LivechatDepartment';
import LivechatInquiryModel from '../models/LivechatInquiry';
import LivechatRoomsModel from '../models/LivechatRooms';
import LivechatVisitorsModel from '../models/LivechatVisitors';
import MessagesModel from '../models/Messages';
import OmnichannelQueueModel from '../models/OmnichannelQueue';
import RoomsModel from '../models/Rooms';
import SettingsModel from '../models/Settings';
import SubscriptionsModel from '../models/Subscriptions';
import UsersModel from '../models/Users';
import { PbxEventsRaw } from './PbxEvents';
import { isRunningMs } from '../../../../server/lib/isRunningMs';

const trashCollection = trash.rawCollection();

export const Users = new UsersRaw(UsersModel.model.rawCollection(), trashCollection);
export const Subscriptions = new SubscriptionsRaw(SubscriptionsModel.model.rawCollection(), { Users }, trashCollection);
export const Settings = new SettingsRaw(SettingsModel.model.rawCollection(), trashCollection);
export const Rooms = new RoomsRaw(RoomsModel.model.rawCollection(), trashCollection);
export const LivechatCustomField = new LivechatCustomFieldRaw(LivechatCustomFieldModel.model.rawCollection(), trashCollection);
export const LivechatDepartment = new LivechatDepartmentRaw(LivechatDepartmentModel.model.rawCollection(), trashCollection);
export const LivechatDepartmentAgents = new LivechatDepartmentAgentsRaw(
	LivechatDepartmentAgentsModel.model.rawCollection(),
	trashCollection,
);
export const LivechatRooms = new LivechatRoomsRaw(LivechatRoomsModel.model.rawCollection(), trashCollection);
export const Messages = new MessagesRaw(MessagesModel.model.rawCollection(), trashCollection);
export const LivechatVisitors = new LivechatVisitorsRaw(LivechatVisitorsModel.model.rawCollection(), trashCollection);
export const LivechatInquiry = new LivechatInquiryRaw(LivechatInquiryModel.model.rawCollection(), trashCollection);
export const LivechatBusinessHours = new LivechatBusinessHoursRaw(LivechatBusinessHoursModel.model.rawCollection(), trashCollection);
// export const Roles = new RolesRaw(RolesModel.model.rawCollection(), { Users, Subscriptions }, trashCollection);
export const OmnichannelQueue = new OmnichannelQueueRaw(OmnichannelQueueModel.model.rawCollection(), trashCollection);
export const ImportData = new ImportDataRaw(ImportDataModel.model.rawCollection(), trashCollection);

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
const prefix = 'rocketchat_';

export const Avatars = new AvatarsRaw(db.collection(`${prefix}avatars`), trashCollection);
export const Analytics = new AnalyticsRaw(
	db.collection(`${prefix}analytics`, { readPreference: readSecondaryPreferred(db) }),
	trashCollection,
);
export const CustomSounds = new CustomSoundsRaw(db.collection(`${prefix}custom_sounds`), trashCollection);
export const CustomUserStatus = new CustomUserStatusRaw(db.collection(`${prefix}custom_user_status`), trashCollection);
export const CredentialTokens = new CredentialTokensRaw(db.collection(`${prefix}credential_tokens`), trashCollection);
export const EmailInbox = new EmailInboxRaw(db.collection(`${prefix}email_inbox`), trashCollection);
export const EmailMessageHistory = new EmailMessageHistoryRaw(db.collection(`${prefix}email_message_history`), trashCollection);
export const EmojiCustom = new EmojiCustomRaw(db.collection(`${prefix}custom_emoji`), trashCollection);
export const ExportOperations = new ExportOperationsRaw(db.collection(`${prefix}export_operations`), trashCollection);
export const FederationKeys = new FederationKeysRaw(db.collection(`${prefix}federation_keys`), trashCollection);
export const FederationServers = new FederationServersRaw(db.collection(`${prefix}federation_servers`), trashCollection);
export const InstanceStatus = new InstanceStatusRaw(db.collection('instances'), trashCollection, {
	preventSetUpdatedAt: true,
});
export const Integrations = new IntegrationsRaw(db.collection(`${prefix}integrations`), trashCollection);
export const IntegrationHistory = new IntegrationHistoryRaw(db.collection(`${prefix}integration_history`), trashCollection);
export const Invites = new InvitesRaw(db.collection(`${prefix}invites`), trashCollection);
export const LivechatTrigger = new LivechatTriggerRaw(db.collection(`${prefix}livechat_trigger`), trashCollection);
export const LoginServiceConfiguration = new LoginServiceConfigurationRaw(
	db.collection('meteor_accounts_loginServiceConfiguration'),
	trashCollection,
	{ preventSetUpdatedAt: true },
);

export const NotificationQueue = new NotificationQueueRaw(db.collection(`${prefix}notification_queue`), trashCollection);
export const OAuthApps = new OAuthAppsRaw(db.collection(`${prefix}oauth_apps`), trashCollection);
export const OEmbedCache = new OEmbedCacheRaw(db.collection(`${prefix}oembed_cache`), trashCollection);
export const Permissions = new PermissionsRaw(db.collection(`${prefix}permissions`), trashCollection);
export const ReadReceipts = new ReadReceiptsRaw(db.collection(`${prefix}read_receipts`), trashCollection);
export const Reports = new ReportsRaw(db.collection(`${prefix}reports`), trashCollection);
export const ServerEvents = new ServerEventsRaw(db.collection(`${prefix}server_events`), trashCollection);
export const Sessions = new SessionsRaw(
	db.collection(`${prefix}sessions`),
	db.collection(`${prefix}sessions`, { readPreference: readSecondaryPreferred(db) }),
	trashCollection,
);
export const Roles = new RolesRaw(db.collection(`${prefix}roles`), { Users, Subscriptions }, trashCollection);
export const SmarshHistory = new SmarshHistoryRaw(db.collection(`${prefix}smarsh_history`), trashCollection);
export const Statistics = new StatisticsRaw(db.collection(`${prefix}statistics`), trashCollection);
export const UsersSessions = new UsersSessionsRaw(db.collection('usersSessions'), trashCollection, {
	preventSetUpdatedAt: true,
});
export const UserDataFiles = new UserDataFilesRaw(db.collection(`${prefix}user_data_files`), trashCollection);
export const Uploads = new UploadsRaw(db.collection(`${prefix}uploads`), trashCollection);
export const WebdavAccounts = new WebdavAccountsRaw(db.collection(`${prefix}webdav_accounts`), trashCollection);
export const VoipRoom = new VoipRoomsRaw(db.collection(`${prefix}room`), trashCollection);
export const PbxEvent = new PbxEventsRaw(db.collection('pbx_events'), trashCollection);
export const LivechatAgentActivity = new LivechatAgentActivityRaw(db.collection(`${prefix}livechat_agent_activity`), trashCollection);

const map = {
	[Messages.col.collectionName]: MessagesModel,
	[Users.col.collectionName]: UsersModel,
	[Subscriptions.col.collectionName]: SubscriptionsModel,
	[Settings.col.collectionName]: SettingsModel,
	[LivechatInquiry.col.collectionName]: LivechatInquiryModel,
	[LivechatDepartmentAgents.col.collectionName]: LivechatDepartmentAgentsModel,
	[Rooms.col.collectionName]: RoomsModel,
};

if (!isRunningMs()) {
	const models = {
		Messages,
		Users,
		Subscriptions,
		Settings,
		LivechatInquiry,
		LivechatDepartmentAgents,
		UsersSessions,
		Permissions,
		Roles,
		Rooms,
		LoginServiceConfiguration,
		InstanceStatus,
		IntegrationHistory,
		Integrations,
		EmailInbox,
		PbxEvent,
	};

	initWatchers(models, api.broadcastLocal.bind(api), (model, fn) => {
		const meteorModel = map[model.col.collectionName] || new BaseDbWatch(model.col.collectionName);
		if (!meteorModel) {
			return;
		}

		meteorModel.on('change', fn);
	});
}
