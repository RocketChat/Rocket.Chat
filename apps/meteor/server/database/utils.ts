import { initDatabaseTracing } from '@rocket.chat/tracing';
import { MongoInternals } from 'meteor/mongo';

export const { db, client } = MongoInternals.defaultRemoteCollectionDriver().mongo;

initDatabaseTracing(client);
