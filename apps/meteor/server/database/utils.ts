import { MongoInternals } from 'meteor/mongo';

export const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;
