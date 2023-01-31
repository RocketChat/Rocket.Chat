import { Mongo } from 'meteor/mongo';
import type { ISubscription } from '@rocket.chat/core-typings';

/** @deprecated */
export const RoomRoles = new Mongo.Collection<Pick<ISubscription, '_id' | 'rid' | 'u' | 'roles'>>(null);
