import { proxify } from './lib/proxify';
import { IAuthorization } from './types/IAuthorization';

// TODO try not having to duplicate the namespace 'authorization' here
export const Authorization = proxify<IAuthorization>('authorization');
