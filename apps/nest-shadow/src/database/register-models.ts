import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import {
  MessagesRaw,
  RoomsRaw,
  SubscriptionsRaw,
  UsersRaw,
  registerModel,
} from '@rocket.chat/models';
import type { Collection, Db } from 'mongodb';

export const TRASH_COLLECTION = 'rocketchat__trash';

// Registers only the models that the shadow endpoints read, so the process
// does not load the full model graph of the monolith.
export function registerModels(
  db: Db,
  trash: Collection<RocketChatRecordDeleted<any>>,
): void {
  registerModel('IUsersModel', new UsersRaw(db));
  registerModel('IRoomsModel', new RoomsRaw(db, trash));
  registerModel('ISubscriptionsModel', new SubscriptionsRaw(db, trash));
  registerModel('IMessagesModel', new MessagesRaw(db, trash));
}
