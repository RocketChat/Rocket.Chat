import { MongoInternals } from 'meteor/mongo';

import { Nps } from '../modules/core-apps/nps.module';
import { registerCoreApp } from '../services/uikit-core-app/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

registerCoreApp(new Nps(db));
