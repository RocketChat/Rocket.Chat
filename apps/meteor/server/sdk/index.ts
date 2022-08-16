import type { IServiceContext } from './types/ServiceClass';
import { proxify, proxifyWithWait } from './lib/proxify';
import type { IAuthorization } from './types/IAuthorization';
import type { IPresence } from './types/IPresence';
import type { IAccount } from './types/IAccount';
import type { ILicense } from './types/ILicense';
import type { IMeteor } from './types/IMeteor';
import type { IUiKitCoreAppService } from './types/IUiKitCoreApp';
import type { IEnterpriseSettings } from './types/IEnterpriseSettings';
import type { IBannerService } from './types/IBannerService';
import type { INPSService } from './types/INPSService';
import type { ITeamService } from './types/ITeamService';
import type { IRoomService } from './types/IRoomService';
import type { IMediaService } from './types/IMediaService';
import type { IVoipService } from './types/IVoipService';
import type { IOmnichannelVoipService } from './types/IOmnichannelVoipService';
import type { IAnalyticsService } from './types/IAnalyticsService';
import type { ILDAPService } from './types/ILDAPService';
import type { IVideoConfService } from './types/IVideoConfService';
import type { ISAUMonitorService } from './types/ISAUMonitorService';
import type { IDeviceManagementService } from './types/IDeviceManagementService';
import { FibersContextStore } from './lib/ContextStore';
import { IAppsService } from './types/IAppsService';

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxifyWithWait<IAuthorization>('authorization');
export const Presence = proxifyWithWait<IPresence>('presence');
export const Account = proxifyWithWait<IAccount>('accounts');
export const License = proxifyWithWait<ILicense>('license');
export const MeteorService = proxifyWithWait<IMeteor>('meteor');
export const Banner = proxifyWithWait<IBannerService>('banner');
export const UiKitCoreApp = proxifyWithWait<IUiKitCoreAppService>('uikit-core-app');
export const NPS = proxifyWithWait<INPSService>('nps');
export const Team = proxifyWithWait<ITeamService>('team');
export const Room = proxifyWithWait<IRoomService>('room');
export const Media = proxifyWithWait<IMediaService>('media');
export const Voip = proxifyWithWait<IVoipService>('voip');
export const LivechatVoip = proxifyWithWait<IOmnichannelVoipService>('omnichannel-voip');
export const Analytics = proxifyWithWait<IAnalyticsService>('analytics');
export const LDAP = proxifyWithWait<ILDAPService>('ldap');
export const SAUMonitor = proxifyWithWait<ISAUMonitorService>('sau-monitor');
export const DeviceManagement = proxifyWithWait<IDeviceManagementService>('device-management');
export const VideoConf = proxifyWithWait<IVideoConfService>('video-conference');
export const Apps = proxifyWithWait<IAppsService>('apps');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');

// TODO Evalute again using AsyncContextStore instead of FibersContextStore in a future Meteor release (after 2.5)
export const asyncLocalStorage = new FibersContextStore<IServiceContext>();
