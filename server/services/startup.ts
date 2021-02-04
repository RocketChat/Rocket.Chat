import { MongoInternals } from 'meteor/mongo';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { BannerService } from './banner/service';
import { MeteorService } from './meteor/service';
import { NPSService } from './nps/service';
import { UiKitCoreApp } from './uikit-core-app/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

api.registerService(new Authorization(db));
api.registerService(new BannerService(db));
api.registerService(new MeteorService());
api.registerService(new UiKitCoreApp());
api.registerService(new NPSService(db));
