import { MongoInternals } from 'meteor/mongo';

import { Nps } from '../modules/core-apps/nps.module';
import { BannerModule } from '../modules/core-apps/banner.module';
import { registerCoreApp } from '../services/uikit-core-app/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

registerCoreApp(new Nps(db));
registerCoreApp(new BannerModule());
