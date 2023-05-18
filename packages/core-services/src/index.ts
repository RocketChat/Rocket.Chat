import { proxify, proxifyWithWait } from './lib/proxify';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from './types/IUploadService';
import type { IAuthorization, RoomAccessValidator } from './types/IAuthorization';
import type { IAuthorizationLivechat } from './types/IAuthorizationLivechat';
import type { IAuthorizationVoip } from './types/IAuthorizationVoip';
import type { IAppsEngineService, AppsEngineAppResult } from './types/IAppsEngineService';
import type { IPresence } from './types/IPresence';
import type { IAccount, ILoginResult } from './types/IAccount';
import type { ILicense } from './types/ILicense';
import type { IMeteor, AutoUpdateRecord } from './types/IMeteor';
import type { IUiKitCoreApp, IUiKitCoreAppService } from './types/IUiKitCoreApp';
import type { IEnterpriseSettings } from './types/IEnterpriseSettings';
import type { IBannerService } from './types/IBannerService';
import type { IFederationService, IFederationServiceEE } from './types/IFederationService';
import type { INPSService, NPSCreatePayload, NPSVotePayload } from './types/INPSService';
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
import type { IMessageReadsService } from './types/IMessageReadsService';
import type {
	IRoomService,
	ICreateRoomParams,
	ISubscriptionExtraData,
	ICreateDiscussionParams,
	ICreateRoomExtraData,
} from './types/IRoomService';
import type { IMediaService, ResizeResult } from './types/IMediaService';
import type { IVoipService } from './types/IVoipService';
import type { IOmnichannelVoipService, FindVoipRoomsParams } from './types/IOmnichannelVoipService';
import type { IAnalyticsService } from './types/IAnalyticsService';
import type { ILDAPService } from './types/ILDAPService';
import type { IVideoConfService, VideoConferenceJoinOptions } from './types/IVideoConfService';
import type { ISAUMonitorService } from './types/ISAUMonitorService';
import type { IDeviceManagementService } from './types/IDeviceManagementService';
import type { IPushService } from './types/IPushService';
import type { IOmnichannelService } from './types/IOmnichannelService';
import type { ITelemetryEvent, TelemetryMap, TelemetryEvents } from './types/ITelemetryEvent';
import type { IOmnichannelTranscriptService } from './types/IOmnichannelTranscriptService';
import type { IQueueWorkerService, HealthAggResult } from './types/IQueueWorkerService';
import type { ITranslationService } from './types/ITranslationService';
import type { IMessageService } from './types/IMessageService';
import type { ISettingsService } from './types/ISettingsService';
import type { IOmnichannelIntegrationService } from './types/IOmnichannelIntegrationService';
import { AppsApiServiceResponse, IAppsApiService, IRequestWithPrivateHash } from './types/IAppsApiService';
import { AppFabricationFulfillment, IAppsManagerService } from './types/IAppsManagerService';
import { IAppsStatisticsService, AppsStatisticsResult } from './types/IAppsStatisticsService';
import { IAppsVideoManagerService } from './types/IAppsVideoManagerService';
import { IAppsConverterService } from './types/IAppsConverterService';
import { ILivechatService, CloseRoomParams } from './types/ILivechatService';

export { asyncLocalStorage } from './lib/asyncLocalStorage';
export { MeteorError, isMeteorError } from './MeteorError';
export { api } from './api';
export { EventSignatures } from './Events';
export { LocalBroker } from './LocalBroker';

export { IBroker, IBrokerNode, BaseMetricOptions, IServiceMetrics } from './types/IBroker';

export { IServiceContext, ServiceClass, IServiceClass, ServiceClassInternal } from './types/ServiceClass';

export { IFederationService, IFederationServiceEE, IFederationJoinExternalPublicRoomInput } from './types/IFederationService';

export {
	AutoUpdateRecord,
	AppsApiServiceResponse,
	AppsStatisticsResult,
	AppFabricationFulfillment,
	FindVoipRoomsParams,
	IAccount,
	IAnalyticsService,
	IAppsApiService,
	IAppsConverterService,
	IAppsEngineService,
	AppsEngineAppResult,
	IAppsManagerService,
	IAppsStatisticsService,
	IAppsVideoManagerService,
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
	IOmnichannelTranscriptService,
	IQueueWorkerService,
	HealthAggResult,
	ITranslationService,
	IMessageService,
	ISettingsService,
	IOmnichannelIntegrationService,
	IRequestWithPrivateHash,
	ILivechatService,
	CloseRoomParams,
	ICreateDiscussionParams,
	ICreateRoomExtraData,
};

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxifyWithWait<IAuthorization>('authorization');
export const Apps = proxifyWithWait<IAppsEngineService>('apps-engine');
export const AppsStatistics = proxifyWithWait<IAppsStatisticsService>('apps-statistics');
export const AppsConverter = proxifyWithWait<IAppsConverterService>('apps-converter');
export const AppsManager = proxifyWithWait<IAppsManagerService>('apps-manager');
export const AppsVideoManager = proxifyWithWait<IAppsVideoManagerService>('apps-video-manager');
export const AppsApiService = proxifyWithWait<IAppsApiService>('apps-api');
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
export const QueueWorker = proxifyWithWait<IQueueWorkerService>('queue-worker');
export const OmnichannelTranscript = proxifyWithWait<IOmnichannelTranscriptService>('omnichannel-transcript');
export const Message = proxifyWithWait<IMessageService>('message');
export const Translation = proxifyWithWait<ITranslationService>('translation');
export const Settings = proxifyWithWait<ISettingsService>('settings');
export const OmnichannelIntegration = proxifyWithWait<IOmnichannelIntegrationService>('omnichannel-integration');
export const Federation = proxifyWithWait<IFederationService>('federation');
export const FederationEE = proxifyWithWait<IFederationServiceEE>('federation-enterprise');
export const Livechat = proxifyWithWait<ILivechatService>('livechat');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');
