import { proxify, proxifyWithWait } from './lib/proxify';
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
import type { IVideoConfService, VideoConferenceJoinOptions } from './types/IVideoConfService';
import type { IVoipService } from './types/IVoipService';

export { asyncLocalStorage } from './lib/asyncLocalStorage';
export { MeteorError, isMeteorError } from './MeteorError';
export { api } from './api';
export { EventNames, EventSignatures } from './events/Events';
export { LocalBroker } from './LocalBroker';

export { IBroker, IBrokerNode, BaseMetricOptions, IServiceMetrics } from './types/IBroker';

export { IServiceContext, ServiceClass, IServiceClass, ServiceClassInternal } from './types/ServiceClass';

export { IFederationService, IFederationServiceEE, IFederationJoinExternalPublicRoomInput } from './types/IFederationService';

export {
	ConversationData,
	AgentOverviewDataOptions,
	ChartDataOptions,
	AnalyticsOverviewDataOptions,
	ChartDataResult,
	AnalyticsOverviewDataResult,
} from './types/IOmnichannelAnalyticsService';

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
	NPSCreatePayload,
	NPSVotePayload,
	proxifyWithWait,
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
};

export const dbWatchersDisabled = ['yes', 'true'].includes(String(process.env.DISABLE_DB_WATCHERS).toLowerCase());

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxifyWithWait<IAuthorization>('authorization');
export const Apps = proxifyWithWait<IAppsEngineService>('apps-engine');
export const Presence = proxifyWithWait<IPresence>('presence');
export const Account = proxifyWithWait<IAccount>('accounts');
export const License = proxifyWithWait<ILicense>('license');
export const MeteorService = proxifyWithWait<IMeteor>('meteor');
export const Banner = proxifyWithWait<IBannerService>('banner');
export const UiKitCoreApp = proxifyWithWait<IUiKitCoreAppService>('uikit-core-app');
export const NPS = proxifyWithWait<INPSService>('nps');
export const Team = proxifyWithWait<ITeamService>('team');
export const MessageReads = proxifyWithWait<IMessageReadsService>('message-reads');
export const Room = proxifyWithWait<IRoomService>('room');
export const Media = proxifyWithWait<IMediaService>('media');
export const Voip = proxifyWithWait<IVoipService>('voip');
export const LivechatVoip = proxifyWithWait<IOmnichannelVoipService>('omnichannel-voip');
export const Analytics = proxifyWithWait<IAnalyticsService>('analytics');
export const LDAP = proxifyWithWait<ILDAPService>('ldap');
export const SAUMonitor = proxifyWithWait<ISAUMonitorService>('sau-monitor');
export const DeviceManagement = proxifyWithWait<IDeviceManagementService>('device-management');
export const VideoConf = proxifyWithWait<IVideoConfService>('video-conference');
export const Upload = proxifyWithWait<IUploadService>('upload');
export const Calendar = proxifyWithWait<ICalendarService>('calendar');
export const QueueWorker = proxifyWithWait<IQueueWorkerService>('queue-worker');
export const OmnichannelTranscript = proxifyWithWait<IOmnichannelTranscriptService>('omnichannel-transcript');
export const Message = proxifyWithWait<IMessageService>('message');
export const Translation = proxifyWithWait<ITranslationService>('translation');
export const Settings = proxifyWithWait<ISettingsService>('settings');
export const OmnichannelIntegration = proxifyWithWait<IOmnichannelIntegrationService>('omnichannel-integration');
export const Federation = proxifyWithWait<IFederationService>('federation');
export const FederationEE = proxifyWithWait<IFederationServiceEE>('federation-enterprise');
export const Omnichannel = proxifyWithWait<IOmnichannelService>('omnichannel');
export const OmnichannelEEService = proxifyWithWait<IOmnichannelEEService>('omnichannel-ee');
export const Import = proxifyWithWait<IImportService>('import');
export const OmnichannelAnalytics = proxifyWithWait<IOmnichannelAnalyticsService>('omnichannel-analytics');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');
