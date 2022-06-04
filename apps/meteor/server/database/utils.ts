import { MongoInternals } from 'meteor/mongo';

export const prefix = 'rocketchat_';

export const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
