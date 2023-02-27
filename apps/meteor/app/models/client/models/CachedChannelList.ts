import type { IRoom } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

export const CachedChannelList = new Mongo.Collection<IRoom>(null);
