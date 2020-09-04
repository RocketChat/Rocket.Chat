import { MongoInternals } from 'meteor/mongo';

import { api } from '../sdk/api';
// import { LocalBroker } from '../sdk/lib/LocalBroker';
import { Authorization } from './authorization/service';

// api.setBroker(new LocalBroker());

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
