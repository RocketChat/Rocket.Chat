import { MongoInternals } from 'meteor/mongo';

import { api } from '../../server/sdk/api';
import { MessageEnterprise } from '../app/message/service';

api.registerService(new MessageEnterprise(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
