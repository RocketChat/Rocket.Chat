import type { RocketChatRecordDeleted, ISubscription, ILivechatInquiryRecord, ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import {
	AnalyticsRaw,
	AppsLogsModel,
	AppsModel,
	AppsPersistenceModel,
	AppsTokensRaw,
	AvatarsRaw,
	BannersDismissRaw,
	BannersRaw,
	CalendarEventRaw,
	CredentialTokensRaw,
	CronHistoryRaw,
	CustomSoundsRaw,
	CustomUserStatusRaw,
	EmailInboxRaw,
	EmailMessageHistoryRaw,
	EmojiCustomRaw,
	ExportOperationsRaw,
	FederationKeysRaw,
	FederationRoomEventsRaw,
	FederationServersRaw,
	FreeSwitchCallRaw,
	FreeSwitchEventRaw,
	ImportDataRaw,
	ImportsModel,
	InstanceStatusRaw,
	IntegrationHistoryRaw,
	IntegrationsRaw,
	InvitesRaw,
	LivechatAgentActivityRaw,
	LivechatBusinessHoursRaw,
	LivechatContactsRaw,
	LivechatCustomFieldRaw,
	LivechatDepartmentAgentsRaw,
	LivechatDepartmentRaw,
	LivechatInquiryRaw,
	LivechatPriorityRaw,
	LivechatRoomsRaw,
	LivechatTriggerRaw,
	LivechatVisitorsRaw,
	LoginServiceConfigurationRaw,
	MatrixBridgedRoomRaw,
	MatrixBridgedUserRaw,
	MessageReadsRaw,
	MessagesRaw,
	MigrationsRaw,
	ModerationReportsRaw,
	NotificationQueueRaw,
	NpsRaw,
	NpsVoteRaw,
	OAuthAccessTokensRaw,
	OAuthAppsRaw,
	OAuthAuthCodesRaw,
	OAuthRefreshTokensRaw,
	OEmbedCacheRaw,
	PbxEventsRaw,
	PermissionsRaw,
	PushTokenRaw,
	ReadReceiptsDummy,
	registerModel,
	ReportsRaw,
	RolesRaw,
	RoomsRaw,
	ServerEventsRaw,
	SessionsRaw,
	SettingsRaw,
	SmarshHistoryRaw,
	StatisticsRaw,
	SubscriptionsRaw,
	TeamMemberRaw,
	TeamRaw,
	UploadsRaw,
	UserDataFilesRaw,
	UsersRaw,
	UsersSessionsRaw,
	VideoConferenceRaw,
	VoipRoomRaw,
	WebdavAccountsRaw,
	WorkspaceCredentialsRaw,
} from '@rocket.chat/models';
import type { Collection } from 'mongodb';

import { trashCollection } from './database/trash';
import { db } from './database/utils';

registerModel('IAnalyticsModel', new AnalyticsRaw(db));
registerModel('IAppLogsModel', new AppsLogsModel(db));
registerModel('IAppsModel', new AppsModel(db));
registerModel('IAppsPersistenceModel', new AppsPersistenceModel(db));
registerModel('IAppsTokensModel', new AppsTokensRaw(db));
registerModel('IAvatarsModel', new AvatarsRaw(db));
registerModel('IBannersDismissModel', new BannersDismissRaw(db));
registerModel('IBannersModel', new BannersRaw(db));
registerModel('ICalendarEventModel', new CalendarEventRaw(db));
registerModel('ICredentialTokensModel', new CredentialTokensRaw(db));
registerModel('ICronHistoryModel', new CronHistoryRaw(db));
registerModel('ICustomSoundsModel', new CustomSoundsRaw(db));
registerModel('ICustomUserStatusModel', new CustomUserStatusRaw(db));
registerModel('IEmailInboxModel', new EmailInboxRaw(db));
registerModel('IEmailMessageHistoryModel', new EmailMessageHistoryRaw(db));
registerModel('IEmojiCustomModel', new EmojiCustomRaw(db, trashCollection));
registerModel('IExportOperationsModel', new ExportOperationsRaw(db));
registerModel('IFederationKeysModel', new FederationKeysRaw(db));
registerModel('IFederationRoomEventsModel', new FederationRoomEventsRaw(db));
registerModel('IFederationServersModel', new FederationServersRaw(db));
registerModel('IFreeSwitchCallModel', new FreeSwitchCallRaw(db));
registerModel('IFreeSwitchEventModel', new FreeSwitchEventRaw(db));
registerModel('IImportDataModel', new ImportDataRaw(db));
registerModel('IImportsModel', new ImportsModel(db));
registerModel('IInstanceStatusModel', new InstanceStatusRaw(db));
registerModel('IIntegrationHistoryModel', new IntegrationHistoryRaw(db));
registerModel('IIntegrationsModel', new IntegrationsRaw(db));
registerModel('IInvitesModel', new InvitesRaw(db));
registerModel('ILivechatAgentActivityModel', new LivechatAgentActivityRaw(db));
registerModel('ILivechatBusinessHoursModel', new LivechatBusinessHoursRaw(db));
registerModel('ILivechatContactsModel', new LivechatContactsRaw(db));
registerModel('ILivechatCustomFieldModel', new LivechatCustomFieldRaw(db));
registerModel(
	'ILivechatDepartmentAgentsModel',
	new LivechatDepartmentAgentsRaw(db, trashCollection as Collection<RocketChatRecordDeleted<ILivechatDepartmentAgents>>),
);
registerModel('ILivechatDepartmentModel', new LivechatDepartmentRaw(db, trashCollection));
registerModel(
	'ILivechatInquiryModel',
	new LivechatInquiryRaw(db, trashCollection as Collection<RocketChatRecordDeleted<ILivechatInquiryRecord>>),
);
registerModel('ILivechatRoomsModel', new LivechatRoomsRaw(db, trashCollection));
registerModel('ILivechatPriorityModel', new LivechatPriorityRaw(db));
registerModel('ILivechatTriggerModel', new LivechatTriggerRaw(db));
registerModel('ILivechatVisitorsModel', new LivechatVisitorsRaw(db));
registerModel('ILoginServiceConfigurationModel', new LoginServiceConfigurationRaw(db));
registerModel('IMatrixBridgedRoomModel', new MatrixBridgedRoomRaw(db));
registerModel('IMatrixBridgedUserModel', new MatrixBridgedUserRaw(db));
registerModel('IMessageReadsModel', new MessageReadsRaw(db));
registerModel('IMessagesModel', new MessagesRaw(db, trashCollection));
registerModel('IMigrationsModel', new MigrationsRaw(db));
registerModel('IModerationReportsModel', new ModerationReportsRaw(db));
registerModel('INotificationQueueModel', new NotificationQueueRaw(db));
registerModel('INpsModel', new NpsRaw(db));
registerModel('INpsVoteModel', new NpsVoteRaw(db));
registerModel('IOAuthAccessTokensModel', new OAuthAccessTokensRaw(db));
registerModel('IOAuthAppsModel', new OAuthAppsRaw(db));
registerModel('IOAuthAuthCodesModel', new OAuthAuthCodesRaw(db));
registerModel('IOAuthRefreshTokensModel', new OAuthRefreshTokensRaw(db));
registerModel('IOEmbedCacheModel', new OEmbedCacheRaw(db));
registerModel('IPbxEventsModel', new PbxEventsRaw(db));
registerModel('IPermissionsModel', new PermissionsRaw(db, trashCollection));
registerModel('IPushTokenModel', new PushTokenRaw(db));
registerModel('IReadReceiptsModel', new ReadReceiptsDummy(), false);
registerModel('IReportsModel', new ReportsRaw(db));
registerModel('IRolesModel', new RolesRaw(db, trashCollection));
registerModel('IRoomsModel', new RoomsRaw(db, trashCollection));
registerModel('IServerEventsModel', new ServerEventsRaw(db));
registerModel('ISessionsModel', new SessionsRaw(db));
registerModel('ISettingsModel', new SettingsRaw(db, trashCollection));
registerModel('ISmarshHistoryModel', new SmarshHistoryRaw(db));
registerModel('IStatisticsModel', new StatisticsRaw(db));
registerModel('ISubscriptionsModel', new SubscriptionsRaw(db, trashCollection as Collection<RocketChatRecordDeleted<ISubscription>>));
registerModel('ITeamMemberModel', new TeamMemberRaw(db));
registerModel('ITeamModel', new TeamRaw(db));
registerModel('IUploadsModel', new UploadsRaw(db));
registerModel('IUserDataFilesModel', new UserDataFilesRaw(db));
registerModel('IUsersModel', new UsersRaw(db, trashCollection));
registerModel('IUsersSessionsModel', new UsersSessionsRaw(db));
registerModel('IVideoConferenceModel', new VideoConferenceRaw(db));
registerModel('IVoipRoomModel', new VoipRoomRaw(db, trashCollection));
registerModel('IWebdavAccountsModel', new WebdavAccountsRaw(db));
registerModel('IWorkspaceCredentialsModel', new WorkspaceCredentialsRaw(db));
