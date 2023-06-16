import { MongoInternals } from 'meteor/mongo';
import { api } from '@rocket.chat/core-services';
import { OmnichannelTranscript, QueueWorker } from '@rocket.chat/omnichannel-services';

import { AnalyticsService } from './analytics/service';
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
import { UploadService } from './upload/service';
import { MessageService } from './messages/service';
import { TranslationService } from './translation/service';
import { SettingsService } from './settings/service';
import { OmnichannelIntegrationService } from './omnichannel-integrations/service';
import { Logger } from '../lib/logger/Logger';
import { enterpriseAdapter } from '../../ee/app/license/server/license';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

api.setEnterpriseAdapter(enterpriseAdapter);

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
api.registerService(new UploadService());
api.registerService(new MessageService());
api.registerService(new TranslationService());
api.registerService(new SettingsService());
api.registerService(new OmnichannelIntegrationService());

// if the process is running in micro services mode we don't need to register services that will run separately
if (!isRunningMs()) {
	void (async (): Promise<void> => {
		const { Presence } = await import('@rocket.chat/presence');

		const { Authorization } = await import('./authorization/service');

		api.registerService(new Presence());
		api.registerService(new Authorization());

		// Run EE services defined outside of the main repo
		// Otherwise, monolith would ignore them :(
		// Always register the service and manage licensing inside the service (tbd)
		api.registerService(new QueueWorker(db, Logger));
		api.registerService(new OmnichannelTranscript(Logger));
	})();
}
