import type {
	ILivechatDepartmentAgents,
	ILivechatInquiryRecord,
	ISetting,
	ISubscription,
	RocketChatRecordDeleted,
} from '@rocket.chat/core-typings';
import type {
	IAnalyticsModel,
	IAvatarsModel,
	IBannersDismissModel,
	IBannersModel,
	ICannedResponseModel,
	ICredentialTokensModel,
	ICustomSoundsModel,
	ICustomUserStatusModel,
	IEmailInboxModel,
	IEmailMessageHistoryModel,
	IEmojiCustomModel,
	IExportOperationsModel,
	IFederationKeysModel,
	IFederationServersModel,
	IFreeSwitchCallModel,
	IFreeSwitchEventModel,
	IInstanceStatusModel,
	IIntegrationHistoryModel,
	IIntegrationsModel,
	IInvitesModel,
	IImportDataModel,
	ILivechatAgentActivityModel,
	ILivechatBusinessHoursModel,
	ILivechatContactsModel,
	ILivechatCustomFieldModel,
	ILivechatDepartmentAgentsModel,
	ILivechatDepartmentModel,
	ILivechatInquiryModel,
	ILivechatPriorityModel,
	ILivechatRoomsModel,
	ILivechatTagModel,
	ILivechatTriggerModel,
	ILivechatUnitModel,
	ILivechatUnitMonitorsModel,
	ILivechatVisitorsModel,
	ILoginServiceConfigurationModel,
	IMessagesModel,
	INotificationQueueModel,
	INpsModel,
	INpsVoteModel,
	IOAuthAppsModel,
	IOAuthAuthCodesModel,
	IOAuthAccessTokensModel,
	IOAuthRefreshTokensModel,
	IOEmbedCacheModel,
	IPbxEventsModel,
	IPushTokenModel,
	IPermissionsModel,
	IReadReceiptsModel,
	IMessageReadsModel,
	IReportsModel,
	IRolesModel,
	IRoomsModel,
	IServerEventsModel,
	ISessionsModel,
	ISettingsModel,
	ISmarshHistoryModel,
	IStatisticsModel,
	ISubscriptionsModel,
	ITeamMemberModel,
	ITeamModel,
	IUploadsModel,
	IUserDataFilesModel,
	IUsersSessionsModel,
	IUsersModel,
	IVideoConferenceModel,
	IVoipRoomModel,
	IWebdavAccountsModel,
	IMatrixBridgedRoomModel,
	IMatrixBridgedUserModel,
	ICalendarEventModel,
	IOmnichannelServiceLevelAgreementsModel,
	IAppsModel,
	IAppsPersistenceModel,
	IAppLogsModel,
	IImportsModel,
	IFederationRoomEventsModel,
	IAppsTokensModel,
	IAuditLogModel,
	ICronHistoryModel,
	IMigrationsModel,
	IModerationReportsModel,
	IWorkspaceCredentialsModel,
} from '@rocket.chat/model-typings';
import type { Collection, Db } from 'mongodb';

import {
	TeamMemberRaw,
	MessagesRaw,
	LivechatInquiryRaw,
	LivechatDepartmentAgentsRaw,
	PermissionsRaw,
	LoginServiceConfigurationRaw,
	InstanceStatusRaw,
	IntegrationHistoryRaw,
	IntegrationsRaw,
	EmailInboxRaw,
	PbxEventsRaw,
	LivechatRoomsRaw,
	LivechatPriorityRaw,
	UploadsRaw,
	LivechatVisitorsRaw,
	RolesRaw,
	RoomsRaw,
	SettingsRaw,
	SubscriptionsRaw,
	TeamRaw,
	UsersRaw,
	UsersSessionsRaw,
} from './modelClasses';
import { proxify, registerModel } from './proxify';

const prefix = 'rocketchat_';
export function getCollectionName(name: string): string {
	return `${prefix}${name}`;
}

const disabledEnvVar = String(process.env.DISABLE_DB_WATCHERS).toLowerCase();

export const dbWatchersDisabled =
	(process.env.NODE_ENV === 'production' && ['yes', 'true'].includes(disabledEnvVar)) ||
	(process.env.NODE_ENV !== 'production' && !['no', 'false'].includes(disabledEnvVar));

export * from './modelClasses';
export * from './DatabaseWatcher';

export * from './dummy/ReadReceipts';

export { registerModel } from './proxify';
export { type Updater, UpdaterImpl } from './updater';

export const Apps = proxify<IAppsModel>('IAppsModel');
export const AppsTokens = proxify<IAppsTokensModel>('IAppsTokensModel');
export const AppsPersistence = proxify<IAppsPersistenceModel>('IAppsPersistenceModel');
export const AppLogs = proxify<IAppLogsModel>('IAppLogsModel');
export const Analytics = proxify<IAnalyticsModel>('IAnalyticsModel');
export const Avatars = proxify<IAvatarsModel>('IAvatarsModel');
export const BannersDismiss = proxify<IBannersDismissModel>('IBannersDismissModel');
export const Banners = proxify<IBannersModel>('IBannersModel');
export const CannedResponse = proxify<ICannedResponseModel>('ICannedResponseModel');
export const CredentialTokens = proxify<ICredentialTokensModel>('ICredentialTokensModel');
export const CustomSounds = proxify<ICustomSoundsModel>('ICustomSoundsModel');
export const CustomUserStatus = proxify<ICustomUserStatusModel>('ICustomUserStatusModel');
export const EmailInbox = proxify<IEmailInboxModel>('IEmailInboxModel');
export const EmailMessageHistory = proxify<IEmailMessageHistoryModel>('IEmailMessageHistoryModel');
export const EmojiCustom = proxify<IEmojiCustomModel>('IEmojiCustomModel');
export const ExportOperations = proxify<IExportOperationsModel>('IExportOperationsModel');
export const FederationServers = proxify<IFederationServersModel>('IFederationServersModel');
export const FederationKeys = proxify<IFederationKeysModel>('IFederationKeysModel');
export const FederationRoomEvents = proxify<IFederationRoomEventsModel>('IFederationRoomEventsModel');
export const FreeSwitchCall = proxify<IFreeSwitchCallModel>('IFreeSwitchCallModel');
export const FreeSwitchEvent = proxify<IFreeSwitchEventModel>('IFreeSwitchEventModel');
export const ImportData = proxify<IImportDataModel>('IImportDataModel');
export const Imports = proxify<IImportsModel>('IImportsModel');
export const InstanceStatus = proxify<IInstanceStatusModel>('IInstanceStatusModel');
export const IntegrationHistory = proxify<IIntegrationHistoryModel>('IIntegrationHistoryModel');
export const Integrations = proxify<IIntegrationsModel>('IIntegrationsModel');
export const Invites = proxify<IInvitesModel>('IInvitesModel');
export const LivechatAgentActivity = proxify<ILivechatAgentActivityModel>('ILivechatAgentActivityModel');
export const LivechatBusinessHours = proxify<ILivechatBusinessHoursModel>('ILivechatBusinessHoursModel');
export const LivechatContacts = proxify<ILivechatContactsModel>('ILivechatContactsModel');
export const LivechatCustomField = proxify<ILivechatCustomFieldModel>('ILivechatCustomFieldModel');
export const LivechatDepartmentAgents = proxify<ILivechatDepartmentAgentsModel>('ILivechatDepartmentAgentsModel');
export const LivechatDepartment = proxify<ILivechatDepartmentModel>('ILivechatDepartmentModel');
export const LivechatInquiry = proxify<ILivechatInquiryModel>('ILivechatInquiryModel');
export const LivechatPriority = proxify<ILivechatPriorityModel>('ILivechatPriorityModel');
export const LivechatRooms = proxify<ILivechatRoomsModel>('ILivechatRoomsModel');
export const LivechatTag = proxify<ILivechatTagModel>('ILivechatTagModel');
export const LivechatTrigger = proxify<ILivechatTriggerModel>('ILivechatTriggerModel');
export const LivechatVisitors = proxify<ILivechatVisitorsModel>('ILivechatVisitorsModel');
export const LivechatUnit = proxify<ILivechatUnitModel>('ILivechatUnitModel');
export const LivechatUnitMonitors = proxify<ILivechatUnitMonitorsModel>('ILivechatUnitMonitorsModel');
export const LoginServiceConfiguration = proxify<ILoginServiceConfigurationModel>('ILoginServiceConfigurationModel');
export const Messages = proxify<IMessagesModel>('IMessagesModel');
export const NotificationQueue = proxify<INotificationQueueModel>('INotificationQueueModel');
export const Nps = proxify<INpsModel>('INpsModel');
export const NpsVote = proxify<INpsVoteModel>('INpsVoteModel');
export const OAuthApps = proxify<IOAuthAppsModel>('IOAuthAppsModel');
export const OAuthAuthCodes = proxify<IOAuthAuthCodesModel>('IOAuthAuthCodesModel');
export const OAuthAccessTokens = proxify<IOAuthAccessTokensModel>('IOAuthAccessTokensModel');
export const OAuthRefreshTokens = proxify<IOAuthRefreshTokensModel>('IOAuthRefreshTokensModel');
export const OEmbedCache = proxify<IOEmbedCacheModel>('IOEmbedCacheModel');
export const PbxEvents = proxify<IPbxEventsModel>('IPbxEventsModel');
export const PushToken = proxify<IPushTokenModel>('IPushTokenModel');
export const Permissions = proxify<IPermissionsModel>('IPermissionsModel');
export const ReadReceipts = proxify<IReadReceiptsModel>('IReadReceiptsModel');
export const MessageReads = proxify<IMessageReadsModel>('IMessageReadsModel');
export const Reports = proxify<IReportsModel>('IReportsModel');
export const Roles = proxify<IRolesModel>('IRolesModel');
export const Rooms = proxify<IRoomsModel>('IRoomsModel');
export const ServerEvents = proxify<IServerEventsModel>('IServerEventsModel');
export const Sessions = proxify<ISessionsModel>('ISessionsModel');
export const Settings = proxify<ISettingsModel>('ISettingsModel');
export const SmarshHistory = proxify<ISmarshHistoryModel>('ISmarshHistoryModel');
export const Statistics = proxify<IStatisticsModel>('IStatisticsModel');
export const Subscriptions = proxify<ISubscriptionsModel>('ISubscriptionsModel');
export const TeamMember = proxify<ITeamMemberModel>('ITeamMemberModel');
export const Team = proxify<ITeamModel>('ITeamModel');
export const Users = proxify<IUsersModel>('IUsersModel');
export const Uploads = proxify<IUploadsModel>('IUploadsModel');
export const UserDataFiles = proxify<IUserDataFilesModel>('IUserDataFilesModel');
export const UsersSessions = proxify<IUsersSessionsModel>('IUsersSessionsModel');
export const VideoConference = proxify<IVideoConferenceModel>('IVideoConferenceModel');
export const VoipRoom = proxify<IVoipRoomModel>('IVoipRoomModel');
export const WebdavAccounts = proxify<IWebdavAccountsModel>('IWebdavAccountsModel');
export const MatrixBridgedRoom = proxify<IMatrixBridgedRoomModel>('IMatrixBridgedRoomModel');
export const MatrixBridgedUser = proxify<IMatrixBridgedUserModel>('IMatrixBridgedUserModel');
export const CalendarEvent = proxify<ICalendarEventModel>('ICalendarEventModel');
export const OmnichannelServiceLevelAgreements = proxify<IOmnichannelServiceLevelAgreementsModel>(
	'IOmnichannelServiceLevelAgreementsModel',
);
export const AuditLog = proxify<IAuditLogModel>('IAuditLogModel');
export const CronHistory = proxify<ICronHistoryModel>('ICronHistoryModel');
export const Migrations = proxify<IMigrationsModel>('IMigrationsModel');
export const ModerationReports = proxify<IModerationReportsModel>('IModerationReportsModel');
export const WorkspaceCredentials = proxify<IWorkspaceCredentialsModel>('IWorkspaceCredentialsModel');

export function registerServiceModels(db: Db, trash?: Collection<RocketChatRecordDeleted<any>>): void {
	registerModel('ISettingsModel', () => new SettingsRaw(db, trash as Collection<RocketChatRecordDeleted<ISetting>>));
	registerModel('IUsersSessionsModel', () => new UsersSessionsRaw(db));
	registerModel('IUsersModel', () => new UsersRaw(db));

	registerModel('IRolesModel', () => new RolesRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db, trash as Collection<RocketChatRecordDeleted<ISubscription>>));
	registerModel('ITeamModel', () => new TeamRaw(db));
	registerModel('ITeamMemberModel', () => new TeamMemberRaw(db));

	registerModel('IMessagesModel', () => new MessagesRaw(db));

	registerModel(
		'ILivechatInquiryModel',
		() => new LivechatInquiryRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>),
	);
	registerModel(
		'ILivechatDepartmentAgentsModel',
		() => new LivechatDepartmentAgentsRaw(db, trash as Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>),
	);

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
