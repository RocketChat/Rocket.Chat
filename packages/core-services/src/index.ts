import { proxify } from './lib/proxify.js';
import type {
	IAISearchService,
	AISearchAnswerMessage,
	AISearchAnswerResult,
	AISearchFilters,
	AISearchModelOption,
	AISearchResult,
	AISearchStatus,
	AISearchType,
} from './types/IAISearchService.js';
import type { IAbacService } from './types/IAbacService.js';
import type { IAccount, ILoginResult } from './types/IAccount.js';
import type { IAnalyticsService } from './types/IAnalyticsService.js';
import type { IApiService } from './types/IApiService.js';
import type { IAppsEngineService } from './types/IAppsEngineService.js';
import type { IAuthorization, RoomAccessValidator, UserWithRoles } from './types/IAuthorization.js';
import type { IAuthorizationLivechat } from './types/IAuthorizationLivechat.js';
import type { IBannerService } from './types/IBannerService.js';
import type { ICalendarService } from './types/ICalendarService.js';
import type { ICallHistoryService } from './types/ICallHistoryService.js';
import type { IDeviceManagementService } from './types/IDeviceManagementService.js';
import type { IEnterpriseSettings } from './types/IEnterpriseSettings.js';
import type { IFederationMatrixService } from './types/IFederationMatrixService.js';
import type { IImportService } from './types/IImportService.js';
import type { ILDAPEEService } from './types/ILDAPEEService.js';
import type { ILDAPService } from './types/ILDAPService.js';
import type { ILicense } from './types/ILicense.js';
import type { IMediaCallService } from './types/IMediaCallService.js';
import type { IMediaService, ResizeResult } from './types/IMediaService.js';
import type { IMessageReadsService } from './types/IMessageReadsService.js';
import type { IMessageService } from './types/IMessageService.js';
import type { IMeteor, AutoUpdateRecord } from './types/IMeteor.js';
import type { INPSService, NPSCreatePayload, NPSVotePayload } from './types/INPSService.js';
import type { IOmnichannelAnalyticsService } from './types/IOmnichannelAnalyticsService.js';
import type { IOmnichannelEEService } from './types/IOmnichannelEEService.js';
import type { IOmnichannelIntegrationService } from './types/IOmnichannelIntegrationService.js';
import type { IOmnichannelService } from './types/IOmnichannelService.js';
import type { IOmnichannelTranscriptService } from './types/IOmnichannelTranscriptService.js';
import type { IPresence } from './types/IPresence.js';
import type { IPushService } from './types/IPushService.js';
import type { IQueueWorkerService, HealthAggResult } from './types/IQueueWorkerService.js';
import type { IRoomService, ICreateRoomParams, ISubscriptionExtraData } from './types/IRoomService.js';
import type { ISAUMonitorService } from './types/ISAUMonitorService.js';
import type { ISettingsService } from './types/ISettingsService.js';
import type { IStatusVisibilityService } from './types/IStatusVisibilityService.js';
import type {
	ITeamService,
	ITeamUpdateData,
	ITeamMemberParams,
	ITeamMemberInfo,
	ITeamInfo,
	ITeamCreateParams,
	ITeamAutocompleteResult,
	IListRoomsFilter,
} from './types/ITeamService.js';
import type { ITelemetryEvent, TelemetryMap, TelemetryEvents } from './types/ITelemetryEvent.js';
import type {
	UiKitCoreAppBlockActionPayload,
	UiKitCoreAppViewClosedPayload,
	UiKitCoreAppViewSubmitPayload,
	IUiKitCoreApp,
	IUiKitCoreAppService,
} from './types/IUiKitCoreApp.js';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from './types/IUploadService.js';
import type { IUserService } from './types/IUserService.js';
import type { IVideoConfService, VideoConferenceJoinOptions } from './types/IVideoConfService.js';
import type { IXMPPServerService } from './types/IXMPPServerService.js';

export type { AppStatusReport } from './types/IAppsEngineService.js';
export type {
	IAbacService,
	AbacActor,
	AbacCreationAttributesDenialReason,
	AbacCreationAttributesResult,
	AbacMembershipPreviewResult,
	AbacRoomAttributesGrant,
	AbacRoomMembershipPreviewPage,
	AbacUsersAllowedInRoomResult,
} from './types/IAbacService.js';
export type { PresenceScope } from './types/IStatusVisibilityService.js';
export { asyncLocalStorage } from './lib/asyncLocalStorage.js';
export { ClientSafeError, isClientSafeError } from './ClientSafeError.js';
export { api } from './api.js';
export type { EventSignatures, RelayedStreamEvent } from './events/Events.js';
export { LocalBroker } from './LocalBroker.js';
export type { ClusterTransport } from './LocalBroker.js';

export type { IBroker, IBrokerNode, BaseMetricOptions, CallingOptions, IServiceMetrics } from './types/IBroker.js';

export type { IServiceContext, IServiceClass } from './types/ServiceClass.js';
export { ServiceClass, ServiceClassInternal } from './types/ServiceClass.js';

export type { IFederationMatrixService } from './types/IFederationMatrixService.js';
export type { IXMPPServerService } from './types/IXMPPServerService.js';

export type {
	ConversationData,
	AgentOverviewDataOptions,
	ChartDataOptions,
	AnalyticsOverviewDataOptions,
	ChartDataResult,
	AnalyticsOverviewDataResult,
} from './types/IOmnichannelAnalyticsService.js';

export { getInstanceMethods } from './lib/getInstanceMethods.js';
export { LocalServiceRegistry, getCallableMethods } from './lib/LocalServiceRegistry.js';
export type { LocalHandler } from './lib/LocalServiceRegistry.js';
export { getConnection, getTrashCollection } from './lib/mongo.js';
export { ServiceStarter } from './lib/ServiceStarter.js';

export type { ICreateRoomOptions } from './types/IRoomService.js';

export type {
	AutoUpdateRecord,
	IAccount,
	IAnalyticsService,
	IApiService,
	IAppsEngineService,
	IAuthorization,
	IAuthorizationLivechat,
	IBannerService,
	ICreateRoomParams,
	IDeviceManagementService,
	IEnterpriseSettings,
	ILDAPEEService,
	ILDAPService,
	ILicense,
	IListRoomsFilter,
	ILoginResult,
	IMediaService,
	IMeteor,
	INPSService,
	IOmnichannelService,
	IPresence,
	IPushService,
	IMediaCallService,
	IMessageReadsService,
	IRoomService,
	ISAUMonitorService,
	ISubscriptionExtraData,
	ITeamAutocompleteResult,
	ITeamCreateParams,
	ITeamInfo,
	ITeamMemberInfo,
	ITeamMemberParams,
	ITeamService,
	ITeamUpdateData,
	ITelemetryEvent,
	UiKitCoreAppBlockActionPayload,
	UiKitCoreAppViewClosedPayload,
	UiKitCoreAppViewSubmitPayload,
	IUiKitCoreApp,
	IUiKitCoreAppService,
	IVideoConfService,
	NPSCreatePayload,
	NPSVotePayload,
	ResizeResult,
	RoomAccessValidator,
	UserWithRoles,
	TelemetryEvents,
	TelemetryMap,
	VideoConferenceJoinOptions,
	ISendFileLivechatMessageParams,
	ISendFileMessageParams,
	IUploadFileParams,
	IUploadService,
	ICalendarService,
	IAISearchService,
	AISearchAnswerMessage,
	AISearchAnswerResult,
	AISearchFilters,
	AISearchModelOption,
	AISearchResult,
	AISearchStatus,
	AISearchType,
	ICallHistoryService,
	IOmnichannelTranscriptService,
	IQueueWorkerService,
	HealthAggResult,
	IMessageService,
	ISettingsService,
	IStatusVisibilityService,
	IOmnichannelEEService,
	IOmnichannelIntegrationService,
	IImportService,
	IOmnichannelAnalyticsService,
	IUserService,
};
export { proxify };

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxify<IAuthorization>('authorization');
export const Apps = proxify<IAppsEngineService>('apps-engine');
export const Presence = proxify<IPresence>('presence');
export const Account = proxify<IAccount>('accounts');
export const License = proxify<ILicense>('license');
export const MeteorService = proxify<IMeteor>('meteor');
export const Banner = proxify<IBannerService>('banner');
export const UiKitCoreApp = proxify<IUiKitCoreAppService>('uikit-core-app');
export const NPS = proxify<INPSService>('nps');
export const Team = proxify<ITeamService>('team');
export const MessageReads = proxify<IMessageReadsService>('message-reads');
export const Room = proxify<IRoomService>('room');
export const Media = proxify<IMediaService>('media');
export const MediaCall = proxify<IMediaCallService>('media-call');
export const Analytics = proxify<IAnalyticsService>('analytics');
export const LDAP = proxify<ILDAPService>('ldap');
export const LDAPEnterprise = proxify<ILDAPEEService>('ldap-enterprise');
export const SAUMonitor = proxify<ISAUMonitorService>('sau-monitor');
export const DeviceManagement = proxify<IDeviceManagementService>('device-management');
export const VideoConf = proxify<IVideoConfService>('video-conference');
export const Upload = proxify<IUploadService>('upload');
export const Calendar = proxify<ICalendarService>('calendar');
export const CallHistory = proxify<ICallHistoryService>('call-history');
export const QueueWorker = proxify<IQueueWorkerService>('queue-worker');
export const OmnichannelTranscript = proxify<IOmnichannelTranscriptService>('omnichannel-transcript');
export const Message = proxify<IMessageService>('message');
export const Settings = proxify<ISettingsService>('settings');
export const StatusVisibility = proxify<IStatusVisibilityService>('status-visibility');
export const OmnichannelIntegration = proxify<IOmnichannelIntegrationService>('omnichannel-integration');
export const Omnichannel = proxify<IOmnichannelService>('omnichannel');
export const OmnichannelEEService = proxify<IOmnichannelEEService>('omnichannel-ee');
export const Import = proxify<IImportService>('import');
export const OmnichannelAnalytics = proxify<IOmnichannelAnalyticsService>('omnichannel-analytics');
export const User = proxify<IUserService>('user');
export const Push = proxify<IPushService>('push');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');

export const FederationMatrix = proxify<IFederationMatrixService>('federation-matrix');
export const XMPPServer = proxify<IXMPPServerService>('xmpp-server');
export const Abac = proxify<IAbacService>('abac');
export const AISearch = proxify<IAISearchService>('ai-search');
