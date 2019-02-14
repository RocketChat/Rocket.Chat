import { CachedChatSubscription } from './CachedChatSubscription';
import mem from 'mem';
export const ChatSubscription = CachedChatSubscription.collection;
ChatSubscription.findOne = mem(ChatSubscription.findOne, { maxAge: 1000 });
