import { MongoInternals } from 'meteor/mongo';

import { AnalyticsService } from './analytics/service';
import { api } from '../sdk/api';
import { AppsEngineService } from './apps-engine/service';
import { AuthorizationLivechat } from '../../app/livechat/server/roomAccessValidator.internalService';
import { BannerService } from './banner/service';
import { LDAPService } from './ldap/service';
import { MediaService } from './image/service';
import { MeteorService } from './meteor/service';
import { NPSService } from './nps/service';
import { RoomService } from './room/service';
import { SAUMonitorService } from './sauMonitor/service';
import { TeamService } from './team/service';
import { UiKitCoreApp } from './uikit-core-app/service';
import { OmnichannelService } from './omnichannel/service';
import { OmnichannelVoipService } from './omnichannel-voip/service';
import { VoipService } from './voip/service';
import { VideoConfService } from './video-conference/service';
import { isRunningMs } from '../lib/isRunningMs';
import { PushService } from './push/service';
import { DeviceManagementService } from './device-management/service';
import { FederationService } from './federation/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

api.registerService(new AppsEngineService());
api.registerService(new AnalyticsService());
api.registerService(new AuthorizationLivechat());
api.registerService(new BannerService());
api.registerService(new LDAPService());
api.registerService(new MediaService());
api.registerService(new MeteorService());
api.registerService(new NPSService());
api.registerService(new RoomService());
api.registerService(new SAUMonitorService());
api.registerService(new VoipService(db));
api.registerService(new OmnichannelService());
api.registerService(new OmnichannelVoipService());
api.registerService(new TeamService());
api.registerService(new UiKitCoreApp());
api.registerService(new PushService());
api.registerService(new DeviceManagementService());
api.registerService(new VideoConfService());
api.registerService(new FederationService());

// if the process is running in micro services mode we don't need to register services that will run separately
if (!isRunningMs()) {
	(async (): Promise<void> => {
		const { Presence } = await import('@rocket.chat/presence');

		const { Authorization } = await import('./authorization/service');

		api.registerService(new Presence());
		api.registerService(new Authorization());
	})();
}
