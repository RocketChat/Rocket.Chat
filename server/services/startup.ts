import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { Streamer } from './streamer/service';
import { MeteorService } from './meteor/service';

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
api.registerService(new MeteorService());

// TODO how to make typescript know that "Meteor.Streamer" actually exists?
api.registerService(new Streamer((Meteor as any).Streamer));
