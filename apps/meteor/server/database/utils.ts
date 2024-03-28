import { MongoInternals } from 'meteor/mongo';

export const { db, client } = MongoInternals.defaultRemoteCollectionDriver().mongo;
