import { AsyncLocalStorage } from 'async_hooks';

import { proxify, proxifyWithWait } from './lib/proxify';
import { IAuthorization } from './types/IAuthorization';
import { IServiceContext } from './types/ServiceClass';
import { IPresence } from './types/IPresence';
import { IAccount } from './types/IAccount';
import { ILicense } from './types/ILicense';
import { IMeteor } from './types/IMeteor';
import { IEnterpriseSettings } from './types/IEnterpriseSettings';

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxifyWithWait<IAuthorization>('authorization');
export const Presence = proxifyWithWait<IPresence>('presence');
export const Account = proxifyWithWait<IAccount>('accounts');
export const License = proxifyWithWait<ILicense>('license');
export const MeteorService = proxifyWithWait<IMeteor>('meteor');

// Calls without wait. Means that the service is optional and the result may be an error
// of service/method not available
export const EnterpriseSettings = proxify<IEnterpriseSettings>('ee-settings');

export const asyncLocalStorage = new AsyncLocalStorage<IServiceContext>();
