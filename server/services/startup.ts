import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { Streamer } from './streamer/service';

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
api.registerService(new Streamer(Meteor.Streamer));
