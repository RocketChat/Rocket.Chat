import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { Streamer } from './streamer/service';

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));

// TODO how to make typescript know that "Meteor.Streamer" actually exists?
api.registerService(new Streamer((Meteor as any).Streamer));
