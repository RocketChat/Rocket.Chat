import type {IUser, IRoom } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

export interface IScheduledMessage {
 _id: string;
  t: 'scheduled_message';
  rid: IRoom['_id'];
  msg: string;
  u: Pick<IUser, '_id' | 'username' | 'name'>;
  ts: Date;
  scheduledAt: Date;
  _updatedAt: Date;
  threadId?: string;
  notifyAt?: Date;
}

export const ScheduledMessages = new Mongo.Collection<IScheduledMessage>('scheduled_messages');

