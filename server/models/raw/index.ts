import PermissionsModel from '../../../app/models/server/models/Permissions';
import { PermissionsRaw } from './Permissions';
import RolesModel from '../../../app/models/server/models/Roles';
import { RolesRaw } from './Roles';
import SubscriptionsModel from '../../../app/models/server/models/Subscriptions';
import { SubscriptionsRaw } from './Subscriptions';
import SettingsModel from '../../../app/models/server/models/Settings';
import { SettingsRaw } from './Settings';
import UsersModel from '../../../app/models/server/models/Users';
import { UsersRaw } from './Users';
import SessionsModel from '../../../app/models/server/models/Sessions';
import { SessionsRaw } from './Sessions';
import RoomsModel from '../../../app/models/server/models/Rooms';
import { RoomsRaw } from './Rooms';
import LivechatCustomFieldModel from '../../../app/models/server/models/LivechatCustomField';
import { LivechatCustomFieldRaw } from './LivechatCustomField';
import LivechatTriggerModel from '../../../app/models/server/models/LivechatTrigger';
import { LivechatTriggerRaw } from './LivechatTrigger';
import LivechatDepartmentModel from '../../../app/models/server/models/LivechatDepartment';
import { LivechatDepartmentRaw } from './LivechatDepartment';
import LivechatDepartmentAgentsModel from '../../../app/models/server/models/LivechatDepartmentAgents';
import { LivechatDepartmentAgentsRaw } from './LivechatDepartmentAgents';
import LivechatRoomsModel from '../../../app/models/server/models/LivechatRooms';
import { LivechatRoomsRaw } from './LivechatRooms';
import MessagesModel from '../../../app/models/server/models/Messages';
import { MessagesRaw } from './Messages';
import LivechatExternalMessagesModel from '../../../app/models/server/models/LivechatExternalMessages';
import { LivechatExternalMessageRaw } from './LivechatExternalMessages';
import LivechatVisitorsModel from '../../../app/models/server/models/LivechatVisitors';
import { LivechatVisitorsRaw } from './LivechatVisitors';
import LivechatInquiryModel from '../../../app/models/server/models/LivechatInquiry';
import { LivechatInquiryRaw } from './LivechatInquiry';
import IntegrationsModel from '../../../app/models/server/models/Integrations';
import { IntegrationsRaw } from './Integrations';
import EmojiCustomModel from '../../../app/models/server/models/EmojiCustom';
import { EmojiCustomRaw } from './EmojiCustom';
import WebdavAccountsModel from '../../../app/models/server/models/WebdavAccounts';
import { WebdavAccountsRaw } from './WebdavAccounts';
import OAuthAppsModel from '../../../app/models/server/models/OAuthApps';
import { OAuthAppsRaw } from './OAuthApps';
import CustomSoundsModel from '../../../app/models/server/models/CustomSounds';
import { CustomSoundsRaw } from './CustomSounds';
import CustomUserStatusModel from '../../../app/models/server/models/CustomUserStatus';
import { CustomUserStatusRaw } from './CustomUserStatus';
import LivechatAgentActivityModel from '../../../app/models/server/models/LivechatAgentActivity';
import { LivechatAgentActivityRaw } from './LivechatAgentActivity';
import StatisticsModel from '../../../app/models/server/models/Statistics';
import { StatisticsRaw } from './Statistics';
import NotificationQueueModel from '../../../app/models/server/models/NotificationQueue';
import { NotificationQueueRaw } from './NotificationQueue';
import LivechatBusinessHoursModel from '../../../app/models/server/models/LivechatBusinessHours';
import { LivechatBusinessHoursRaw } from './LivechatBusinessHours';
import ServerEventModel from '../../../app/models/server/models/ServerEvents';
import { UsersSessionsRaw } from './UsersSessions';
import UsersSessionsModel from '../../../app/models/server/models/UsersSessions';
import { ServerEventsRaw } from './ServerEvents';
import { trash } from '../../../app/models/server/models/_BaseDb';
import LoginServiceConfigurationModel from '../../../app/models/server/models/LoginServiceConfiguration';
import { LoginServiceConfigurationRaw } from './LoginServiceConfiguration';
import { InstanceStatusRaw } from './InstanceStatus';
import InstanceStatusModel from '../../../app/models/server/models/InstanceStatus';
import { IntegrationHistoryRaw } from './IntegrationHistory';
import IntegrationHistoryModel from '../../../app/models/server/models/IntegrationHistory';
import OmnichannelQueueModel from '../../../app/models/server/models/OmnichannelQueue';
import { OmnichannelQueueRaw } from './OmnichannelQueue';
import EmailInboxModel from '../../../app/models/server/models/EmailInbox';
import { EmailInboxRaw } from './EmailInbox';
import EmailMessageHistoryModel from '../../../app/models/server/models/EmailMessageHistory';
import { EmailMessageHistoryRaw } from './EmailMessageHistory';
import { api } from '../../sdk/api';
import { initWatchers } from '../../modules/watchers/watchers.module';

const trashCollection = trash.rawCollection();

export const Permissions = new PermissionsRaw(PermissionsModel.model.rawCollection(), trashCollection);
export const Subscriptions = new SubscriptionsRaw(SubscriptionsModel.model.rawCollection(), trashCollection);
export const Settings = new SettingsRaw(SettingsModel.model.rawCollection(), trashCollection);
export const Users = new UsersRaw(UsersModel.model.rawCollection(), trashCollection);
export const Rooms = new RoomsRaw(RoomsModel.model.rawCollection(), trashCollection);
export const LivechatCustomField = new LivechatCustomFieldRaw(LivechatCustomFieldModel.model.rawCollection(), trashCollection);
export const LivechatTrigger = new LivechatTriggerRaw(LivechatTriggerModel.model.rawCollection(), trashCollection);
export const LivechatDepartment = new LivechatDepartmentRaw(LivechatDepartmentModel.model.rawCollection(), trashCollection);
export const LivechatDepartmentAgents = new LivechatDepartmentAgentsRaw(LivechatDepartmentAgentsModel.model.rawCollection(), trashCollection);
export const LivechatRooms = new LivechatRoomsRaw(LivechatRoomsModel.model.rawCollection(), trashCollection);
export const Messages = new MessagesRaw(MessagesModel.model.rawCollection(), trashCollection);
export const LivechatExternalMessage = new LivechatExternalMessageRaw(LivechatExternalMessagesModel.model.rawCollection(), trashCollection);
export const LivechatVisitors = new LivechatVisitorsRaw(LivechatVisitorsModel.model.rawCollection(), trashCollection);
export const LivechatInquiry = new LivechatInquiryRaw(LivechatInquiryModel.model.rawCollection(), trashCollection);
export const Integrations = new IntegrationsRaw(IntegrationsModel.model.rawCollection(), trashCollection);
export const EmojiCustom = new EmojiCustomRaw(EmojiCustomModel.model.rawCollection(), trashCollection);
export const WebdavAccounts = new WebdavAccountsRaw(WebdavAccountsModel.model.rawCollection(), trashCollection);
export const OAuthApps = new OAuthAppsRaw(OAuthAppsModel.model.rawCollection(), trashCollection);
export const CustomSounds = new CustomSoundsRaw(CustomSoundsModel.model.rawCollection(), trashCollection);
export const CustomUserStatus = new CustomUserStatusRaw(CustomUserStatusModel.model.rawCollection(), trashCollection);
export const LivechatAgentActivity = new LivechatAgentActivityRaw(LivechatAgentActivityModel.model.rawCollection(), trashCollection);
export const Statistics = new StatisticsRaw(StatisticsModel.model.rawCollection(), trashCollection);
export const NotificationQueue = new NotificationQueueRaw(NotificationQueueModel.model.rawCollection(), trashCollection);
export const LivechatBusinessHours = new LivechatBusinessHoursRaw(LivechatBusinessHoursModel.model.rawCollection(), trashCollection);
export const ServerEvents = new ServerEventsRaw(ServerEventModel.model.rawCollection(), trashCollection);
export const Roles = new RolesRaw(RolesModel.model.rawCollection(), trashCollection, { Users, Subscriptions });
export const UsersSessions = new UsersSessionsRaw(UsersSessionsModel.model.rawCollection(), trashCollection);
export const LoginServiceConfiguration = new LoginServiceConfigurationRaw(LoginServiceConfigurationModel.model.rawCollection(), trashCollection);
export const InstanceStatus = new InstanceStatusRaw(InstanceStatusModel.model.rawCollection(), trashCollection);
export const IntegrationHistory = new IntegrationHistoryRaw(IntegrationHistoryModel.model.rawCollection(), trashCollection);
export const Sessions = new SessionsRaw(SessionsModel.model.rawCollection(), trashCollection);
export const OmnichannelQueue = new OmnichannelQueueRaw(OmnichannelQueueModel.model.rawCollection(), trashCollection);
export const EmailInbox = new EmailInboxRaw(EmailInboxModel.model.rawCollection(), trashCollection);
export const EmailMessageHistory = new EmailMessageHistoryRaw(EmailMessageHistoryModel.model.rawCollection(), trashCollection);

const map = {
	[Messages.col.collectionName]: MessagesModel,
	[Users.col.collectionName]: UsersModel,
	[Subscriptions.col.collectionName]: SubscriptionsModel,
	[Settings.col.collectionName]: SettingsModel,
	[Roles.col.collectionName]: RolesModel,
	[Permissions.col.collectionName]: PermissionsModel,
	[LivechatInquiry.col.collectionName]: LivechatInquiryModel,
	[LivechatDepartmentAgents.col.collectionName]: LivechatDepartmentAgentsModel,
	[UsersSessions.col.collectionName]: UsersSessionsModel,
	[Rooms.col.collectionName]: RoomsModel,
	[LoginServiceConfiguration.col.collectionName]: LoginServiceConfigurationModel,
	[InstanceStatus.col.collectionName]: InstanceStatusModel,
	[IntegrationHistory.col.collectionName]: IntegrationHistoryModel,
	[Integrations.col.collectionName]: IntegrationsModel,
	[EmailInbox.col.collectionName]: EmailInboxModel,
};

if (!process.env.DISABLE_DB_WATCH) {
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
	};

	initWatchers(models, api.broadcastLocal.bind(api), (model, fn) => {
		const meteorModel = map[model.col.collectionName];
		if (!meteorModel) {
			return;
		}

		meteorModel.on('change', fn);
	});
}
