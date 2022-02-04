import { IServiceContext } from './types/ServiceClass';
import { proxify, proxifyWithWait } from './lib/proxify';
import { IAuthorization } from './types/IAuthorization';
import { IPresence } from './types/IPresence';
import { IAccount } from './types/IAccount';
import { ILicense } from './types/ILicense';
import { IMeteor } from './types/IMeteor';
import { IUiKitCoreAppService } from './types/IUiKitCoreApp';
import { IEnterpriseSettings } from './types/IEnterpriseSettings';
import { IBannerService } from './types/IBannerService';
import { INPSService } from './types/INPSService';
import { ITeamService } from './types/ITeamService';
import { IRoomService } from './types/IRoomService';
import { IMediaService } from './types/IMediaService';
import { IAnalyticsService } from './types/IAnalyticsService';
import { ILDAPService } from './types/ILDAPService';
import { ISAUMonitorService } from './types/ISAUMonitorService';
import { FibersContextStore } from './lib/ContextStore';

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
export const Analytics = proxifyWithWait<IAnalyticsService>('analytics');
export const LDAP = proxifyWithWait<ILDAPService>('ldap');
export const SAUMonitor = proxifyWithWait<ISAUMonitorService>('sau-monitor');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');

// TODO Evalute again using AsyncContextStore instead of FibersContextStore in a future Meteor release (after 2.5)
export const asyncLocalStorage = new FibersContextStore<IServiceContext>();
