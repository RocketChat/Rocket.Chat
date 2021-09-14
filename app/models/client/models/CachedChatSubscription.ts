import { CachedCollection } from '../../../ui-cached-collection';
import { ISubscription } from '../../../../definition/ISubscription';

export const CachedChatSubscription = new CachedCollection<ISubscription>({ name: 'subscriptions' });
