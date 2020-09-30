import { MongoInternals } from 'meteor/mongo';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { StreamService } from './stream/service';
import { MeteorService } from './meteor/service';
import { NotificationService } from './listeners/notification';
import { Stream } from '../../app/notifications/server/lib/Notifications';

api.registerService(new Authorization(MongoInternals.defaultRemoteCollectionDriver().mongo.db));
api.registerService(new MeteorService());
api.registerService(new StreamService(Stream));
api.registerService(new NotificationService());
