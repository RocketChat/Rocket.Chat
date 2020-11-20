import PermissionsModel from '../models/Permissions';
import { PermissionsRaw } from './Permissions';
import RolesModel from '../models/Roles';
import { RolesRaw } from './Roles';
import SubscriptionsModel from '../models/Subscriptions';
import { SubscriptionsRaw } from './Subscriptions';
import SettingsModel from '../models/Settings';
import { SettingsRaw } from './Settings';
import UsersModel from '../models/Users';
import { UsersRaw } from './Users';
import SessionsModel from '../models/Sessions';
import { SessionsRaw } from './Sessions';
import RoomsModel from '../models/Rooms';
import { RoomsRaw } from './Rooms';
import LivechatCustomFieldModel from '../models/LivechatCustomField';
import { LivechatCustomFieldRaw } from './LivechatCustomField';
import LivechatTriggerModel from '../models/LivechatTrigger';
import { LivechatTriggerRaw } from './LivechatTrigger';
import LivechatDepartmentModel from '../models/LivechatDepartment';
import { LivechatDepartmentRaw } from './LivechatDepartment';
import LivechatDepartmentAgentsModel from '../models/LivechatDepartmentAgents';
import { LivechatDepartmentAgentsRaw } from './LivechatDepartmentAgents';
import LivechatRoomsModel from '../models/LivechatRooms';
import { LivechatRoomsRaw } from './LivechatRooms';
import MessagesModel from '../models/Messages';
import { MessagesRaw } from './Messages';
import LivechatExternalMessagesModel from '../models/LivechatExternalMessages';
import { LivechatExternalMessageRaw } from './LivechatExternalMessages';
import LivechatVisitorsModel from '../models/LivechatVisitors';
import { LivechatVisitorsRaw } from './LivechatVisitors';
import LivechatInquiryModel from '../models/LivechatInquiry';
import { LivechatInquiryRaw } from './LivechatInquiry';
import IntegrationsModel from '../models/Integrations';
import { IntegrationsRaw } from './Integrations';
import EmojiCustomModel from '../models/EmojiCustom';
import { EmojiCustomRaw } from './EmojiCustom';
import WebdavAccountsModel from '../models/WebdavAccounts';
import { WebdavAccountsRaw } from './WebdavAccounts';
import OAuthAppsModel from '../models/OAuthApps';
import { OAuthAppsRaw } from './OAuthApps';
import CustomSoundsModel from '../models/CustomSounds';
import { CustomSoundsRaw } from './CustomSounds';
import CustomUserStatusModel from '../models/CustomUserStatus';
import { CustomUserStatusRaw } from './CustomUserStatus';
import LivechatAgentActivityModel from '../models/LivechatAgentActivity';
import { LivechatAgentActivityRaw } from './LivechatAgentActivity';
import StatisticsModel from '../models/Statistics';
import { StatisticsRaw } from './Statistics';
import NotificationQueueModel from '../models/NotificationQueue';
import { NotificationQueueRaw } from './NotificationQueue';
import LivechatBusinessHoursModel from '../models/LivechatBusinessHours';
import { LivechatBusinessHoursRaw } from './LivechatBusinessHours';
import ServerEventModel from '../models/ServerEvents';
import { UsersSessionsRaw } from './UsersSessions';
import UsersSessionsModel from '../models/UsersSessions';
import { ServerEventsRaw } from './ServerEvents';
import { trash } from '../models/_BaseDb';
import LoginServiceConfigurationModel from '../models/LoginServiceConfiguration';
import { LoginServiceConfigurationRaw } from './LoginServiceConfiguration';
import { InstanceStatusRaw } from './InstanceStatus';
import InstanceStatusModel from '../models/InstanceStatus';
import { IntegrationHistoryRaw } from './IntegrationHistory';
import IntegrationHistoryModel from '../models/IntegrationHistory';
import OmnichannelQueueModel from '../models/OmnichannelQueue';
import { OmnichannelQueueRaw } from './OmnichannelQueue';
import { api } from '../../../../server/sdk/api';
import { initWatchers } from '../../../../server/modules/watchers/watchers.module';

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
	};

	initWatchers(models, api.broadcastLocal.bind(api), (model, fn) => {
		const meteorModel = map[model.col.collectionName];
		if (!meteorModel) {
			return;
		}

		meteorModel.on('change', fn);
	});
}
