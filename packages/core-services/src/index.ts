import { proxify, proxifyWithWait } from './lib/proxify';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from './types/IUploadService';
import type { IAuthorization, RoomAccessValidator } from './types/IAuthorization';
import type { IAuthorizationLivechat } from './types/IAuthorizationLivechat';
import type { IAuthorizationVoip } from './types/IAuthorizationVoip';
import type { IAppsEngineService } from './types/IAppsEngineService';
import type { IPresence } from './types/IPresence';
import type { IAccount, ILoginResult } from './types/IAccount';
import type { ILicense } from './types/ILicense';
import type { IMeteor, AutoUpdateRecord } from './types/IMeteor';
import type { IUiKitCoreApp, IUiKitCoreAppService } from './types/IUiKitCoreApp';
import type { IEnterpriseSettings } from './types/IEnterpriseSettings';
import type { IBannerService } from './types/IBannerService';
import type { IFederationService } from './types/IFederationService';
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
import type { IAppsApiService, IRequestWithPrivateHash } from './types/IAppsApiService';
import type { IAppsConverterService } from './types/IAppsConverterService';
import type { IAppsManagerService } from './types/IAppsManagerService';
import type { IAppsService } from './types/IAppsService';
import type { IAppsStatisticsService } from './types/IAppsStatisticsService';
import type { IAppsVideoManagerService } from './types/IAppsVideoManagerService';
import type { IFetchService } from './types/IFetchService';
import type { ILivechatService, CloseRoomParams } from './types/ILivechatService';
import type { IMessageService } from './types/IMessageService';
import type { INotificationService } from './types/INotificationService';
import type { ISlashCommandService } from './types/ISlashCommandService';
import type { ICloudService, IAccessToken } from './types/ICloudService';
import type { IUserService, ISetUserAvatarParams } from './types/IUserService';
import type { IOmnichannelTranscriptService } from './types/IOmnichannelTranscriptService';
import type { IQueueWorkerService, HealthAggResult } from './types/IQueueWorkerService';
import type { ITranslationService } from './types/ITranslationService';
import type { ISettingsService } from './types/ISettingsService';

export { asyncLocalStorage } from './lib/asyncLocalStorage';
export { MeteorError, isMeteorError } from './MeteorError';
export { api } from './api';
export { EventSignatures } from './Events';
export { LocalBroker } from './LocalBroker';

export { IBroker, IBrokerNode, BaseMetricOptions, IServiceMetrics } from './types/IBroker';

export { IServiceContext, ServiceClass, IServiceClass, ServiceClassInternal } from './types/ServiceClass';

export {
	AutoUpdateRecord,
	FindVoipRoomsParams,
	IAccount,
	IAnalyticsService,
	IAppsEngineService,
	IAuthorization,
	IAuthorizationLivechat,
	IAuthorizationVoip,
	IBannerService,
	ICreateRoomParams,
	IDeviceManagementService,
	IEnterpriseSettings,
	IFederationService,
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
	ICreateDiscussionParams,
	ICreateRoomExtraData,
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
	IAppsService,
	IAppsStatisticsService,
	IAppsConverterService,
	IAppsManagerService,
	IAppsVideoManagerService,
	IAppsApiService,
	IRequestWithPrivateHash,
	IFetchService,
	ILivechatService,
	CloseRoomParams,
	IMessageService,
	INotificationService,
	ISlashCommandService,
	ICloudService,
	IAccessToken,
	IUserService,
	ISetUserAvatarParams,
	IOmnichannelTranscriptService,
	IQueueWorkerService,
	HealthAggResult,
	ITranslationService,
	ISettingsService,
};

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
export const Cloud = proxifyWithWait<ICloudService>('cloud');
export const User = proxifyWithWait<IUserService>('user');
export const Apps = proxifyWithWait<IAppsService>('apps');
export const AppsStatistics = proxifyWithWait<IAppsStatisticsService>('apps');
export const AppsConverter = proxifyWithWait<IAppsConverterService>('apps');
export const AppsManager = proxifyWithWait<IAppsManagerService>('apps');
export const AppsVideoManager = proxifyWithWait<IAppsVideoManagerService>('apps');
export const AppsApiService = proxifyWithWait<IAppsApiService>('apps');
export const FetchService = proxifyWithWait<IFetchService>('fetch');
export const LivechatService = proxifyWithWait<ILivechatService>('livechat');
export const MessageService = proxifyWithWait<IMessageService>('message');
export const NotificationService = proxifyWithWait<INotificationService>('notification');
export const SlashCommandService = proxifyWithWait<ISlashCommandService>('slashcommand');
export const QueueWorker = proxifyWithWait<IQueueWorkerService>('queue-worker');
export const OmnichannelTranscript = proxifyWithWait<IOmnichannelTranscriptService>('omnichannel-transcript');
export const Message = proxifyWithWait<IMessageService>('message');
export const Translation = proxifyWithWait<ITranslationService>('translation');
export const Settings = proxifyWithWait<ISettingsService>('settings');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');
