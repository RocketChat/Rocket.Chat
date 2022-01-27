import { MongoInternals } from 'meteor/mongo';

import { api } from '../sdk/api';
import { Authorization } from './authorization/service';
import { BannerService } from './banner/service';
import { MeteorService } from './meteor/service';
import { NPSService } from './nps/service';
import { RoomService } from './room/service';
import { TeamService } from './team/service';
import { UiKitCoreApp } from './uikit-core-app/service';
import { MediaService } from './image/service';
import { AnalyticsService } from './analytics/service';
import { LDAPService } from './ldap/service';
import { SAUMonitorService } from './sauMonitor/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

api.registerService(new Authorization(db));
api.registerService(new BannerService(db));
api.registerService(new MeteorService());
api.registerService(new UiKitCoreApp());
api.registerService(new NPSService(db));
api.registerService(new RoomService(db));
api.registerService(new TeamService(db));
api.registerService(new MediaService());
api.registerService(new AnalyticsService(db));
api.registerService(new LDAPService());
api.registerService(new SAUMonitorService());
