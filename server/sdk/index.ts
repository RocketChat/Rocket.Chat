import { AsyncLocalStorage } from 'async_hooks';

import { proxify } from './lib/proxify';
import { IAuthorization } from './types/IAuthorization';
import { IServiceContext } from './types/ServiceClass';
import { IPresence } from './types/IPresence';

// TODO try not having to duplicate the namespace 'authorization' here
export const Authorization = proxify<IAuthorization>('authorization');
export const Presence = proxify<IPresence>('presence');

export const asyncLocalStorage = new AsyncLocalStorage<IServiceContext>();
