import { CachedCollection } from '../../../ui-cached-collection';
import { IRoom } from '../../../../definition/IRoom';

export const CachedChatRoom = new CachedCollection<IRoom>({ name: 'rooms' });
