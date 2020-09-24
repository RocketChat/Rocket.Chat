import { AsyncLocalStorage } from 'async_hooks';

import { proxify } from './lib/proxify';
import { IAuthorization } from './types/IAuthorization';
import { IServiceContext } from './types/ServiceClass';
import { IPresence } from './types/IPresence';
import { IAccount } from './types/IAccount';
import { ILicense } from './types/ILicense';
import { IStreamer } from './types/IStreamer';

// TODO think in a way to not have to pass the service name to proxify here as well
export const Authorization = proxify<IAuthorization>('authorization');
export const Presence = proxify<IPresence>('presence');
export const Account = proxify<IAccount>('accounts');
export const License = proxify<ILicense>('license');
export const Streamer = proxify<IStreamer>('streamer');

export const asyncLocalStorage = new AsyncLocalStorage<IServiceContext>();
