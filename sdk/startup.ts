import { MongoInternals } from 'meteor/mongo';

import { Authorization } from './services/authorization';
import { api } from './api';
import { LocalBroker } from './lib/LocalBroker';

api.setBroker(new LocalBroker());

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
