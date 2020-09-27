import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { StreamService } from './stream/service';
import { MeteorService } from './meteor/service';

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
api.registerService(new MeteorService());
api.registerService(new StreamService(Meteor.Streamer));
