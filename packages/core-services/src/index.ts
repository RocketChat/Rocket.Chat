import { proxify } from './lib/proxify';
import type { IAccount, ILoginResult } from './types/IAccount';
import type { IAnalyticsService } from './types/IAnalyticsService';
import { IApiService } from './types/IApiService';
import type { IAppsEngineService } from './types/IAppsEngineService';
import type { IAuthorization, RoomAccessValidator } from './types/IAuthorization';
import type { IAuthorizationLivechat } from './types/IAuthorizationLivechat';
import type { IAuthorizationVoip } from './types/IAuthorizationVoip';
import type { IBannerService } from './types/IBannerService';
import type { ICalendarService } from './types/ICalendarService';
import type { IDeviceManagementService } from './types/IDeviceManagementService';
import type { IEnterpriseSettings } from './types/IEnterpriseSettings';
import type { IFederationService, IFederationServiceEE } from './types/IFederationService';
import type { IImportService } from './types/IImportService';
import type { ILDAPService } from './types/ILDAPService';
import type { ILicense } from './types/ILicense';
import type { IMediaService, ResizeResult } from './types/IMediaService';
import type { IMessageReadsService } from './types/IMessageReadsService';
import type { IMessageService } from './types/IMessageService';
import type { IMeteor, AutoUpdateRecord } from './types/IMeteor';
import type { INPSService, NPSCreatePayload, NPSVotePayload } from './types/INPSService';
import type { IOmnichannelAnalyticsService } from './types/IOmnichannelAnalyticsService';
import type { IOmnichannelEEService } from './types/IOmnichannelEEService';
import type { IOmnichannelIntegrationService } from './types/IOmnichannelIntegrationService';
import type { IOmnichannelService } from './types/IOmnichannelService';
import type { IOmnichannelTranscriptService } from './types/IOmnichannelTranscriptService';
import type { IOmnichannelVoipService, FindVoipRoomsParams } from './types/IOmnichannelVoipService';
import type { IPresence } from './types/IPresence';
import type { IPushService } from './types/IPushService';
import type { IQueueWorkerService, HealthAggResult } from './types/IQueueWorkerService';
import type { IRoomService, ICreateRoomParams, ISubscriptionExtraData } from './types/IRoomService';
import type { ISAUMonitorService } from './types/ISAUMonitorService';
import type { ISettingsService } from './types/ISettingsService';
import type {
	ITeamService,
	ITeamUpdateData,
	ITeamMemberParams,
	ITeamMemberInfo,
	ITeamInfo,
	ITeamCreateParams,
	ITeamAutocompleteResult,
	IListRoomsFilter,
} from './types/ITeamService';
import type { ITelemetryEvent, TelemetryMap, TelemetryEvents } from './types/ITelemetryEvent';
import type { ITranslationService } from './types/ITranslationService';
import type { UiKitCoreAppPayload, IUiKitCoreApp, IUiKitCoreAppService } from './types/IUiKitCoreApp';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from './types/IUploadService';
import type { IUserService } from './types/IUserService';
import type { IVideoConfService, VideoConferenceJoinOptions } from './types/IVideoConfService';
import type { IVoipFreeSwitchService } from './types/IVoipFreeSwitchService';
import type { IVoipService } from './types/IVoipService';

export { asyncLocalStorage } from './lib/asyncLocalStorage';
export { MeteorError, isMeteorError } from './MeteorError';
export { api } from './api';
export { EventSignatures } from './events/Events';
export { LocalBroker } from './LocalBroker';

export { IBroker, IBrokerNode, BaseMetricOptions, IServiceMetrics } from './types/IBroker';

export { IServiceContext, ServiceClass, IServiceClass, ServiceClassInternal } from './types/ServiceClass';

export {
	IFederationService,
	IFederationServiceEE,
	IFederationJoinExternalPublicRoomInput,
	FederationConfigurationStatus,
} from './types/IFederationService';

export {
	ConversationData,
	AgentOverviewDataOptions,
	ChartDataOptions,
	AnalyticsOverviewDataOptions,
	ChartDataResult,
	AnalyticsOverviewDataResult,
} from './types/IOmnichannelAnalyticsService';

export { getConnection, getTrashCollection } from './lib/mongo';
export { ServiceStarter } from './lib/ServiceStarter';

export {
	AutoUpdateRecord,
	FindVoipRoomsParams,
	IAccount,
	IAnalyticsService,
	IApiService,
	IAppsEngineService,
	IAuthorization,
	IAuthorizationLivechat,
	IAuthorizationVoip,
	IBannerService,
	ICreateRoomParams,
	IDeviceManagementService,
	IEnterpriseSettings,
	ILDAPService,
	ILicense,
	IListRoomsFilter,
	ILoginResult,
	IMediaService,
	IMeteor,
	INPSService,
	IOmnichannelService,
	IOmnichannelVoipService,
	IPresence,
	IPushService,
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
	UiKitCoreAppPayload,
	IUiKitCoreApp,
	IUiKitCoreAppService,
	IVideoConfService,
	IVoipService,
	IVoipFreeSwitchService,
	NPSCreatePayload,
	NPSVotePayload,
	proxify,
	ResizeResult,
	RoomAccessValidator,
	TelemetryEvents,
	TelemetryMap,
	VideoConferenceJoinOptions,
	ISendFileLivechatMessageParams,
	ISendFileMessageParams,
	IUploadFileParams,
	IUploadService,
	ICalendarService,
	IOmnichannelTranscriptService,
	IQueueWorkerService,
	HealthAggResult,
	ITranslationService,
	IMessageService,
	ISettingsService,
	IOmnichannelEEService,
	IOmnichannelIntegrationService,
	IImportService,
	IOmnichannelAnalyticsService,
	IUserService,
};

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
export const VoipAsterisk = proxify<IVoipService>('voip-asterisk');
export const VoipFreeSwitch = proxify<IVoipFreeSwitchService>('voip-freeswitch');
export const LivechatVoip = proxify<IOmnichannelVoipService>('omnichannel-voip');
export const Analytics = proxify<IAnalyticsService>('analytics');
export const LDAP = proxify<ILDAPService>('ldap');
export const SAUMonitor = proxify<ISAUMonitorService>('sau-monitor');
export const DeviceManagement = proxify<IDeviceManagementService>('device-management');
export const VideoConf = proxify<IVideoConfService>('video-conference');
export const Upload = proxify<IUploadService>('upload');
export const Calendar = proxify<ICalendarService>('calendar');
export const QueueWorker = proxify<IQueueWorkerService>('queue-worker');
export const OmnichannelTranscript = proxify<IOmnichannelTranscriptService>('omnichannel-transcript');
export const Message = proxify<IMessageService>('message');
export const Translation = proxify<ITranslationService>('translation');
export const Settings = proxify<ISettingsService>('settings');
export const OmnichannelIntegration = proxify<IOmnichannelIntegrationService>('omnichannel-integration');
export const Federation = proxify<IFederationService>('federation');
export const FederationEE = proxify<IFederationServiceEE>('federation-enterprise');
export const Omnichannel = proxify<IOmnichannelService>('omnichannel');
export const OmnichannelEEService = proxify<IOmnichannelEEService>('omnichannel-ee');
export const Import = proxify<IImportService>('import');
export const OmnichannelAnalytics = proxify<IOmnichannelAnalyticsService>('omnichannel-analytics');
export const User = proxify<IUserService>('user');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');
