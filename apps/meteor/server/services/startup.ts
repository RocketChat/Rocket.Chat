import { api } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { OmnichannelTranscript, QueueWorker } from '@rocket.chat/omnichannel-services';
import { MongoInternals } from 'meteor/mongo';

import { AuthorizationLivechat } from '../../app/livechat/server/roomAccessValidator.internalService';
import { isRunningMs } from '../lib/isRunningMs';
import { AnalyticsService } from './analytics/service';
import { AppsEngineService } from './apps-engine/service';
import { BannerService } from './banner/service';
import { CalendarService } from './calendar/service';
import { DeviceManagementService } from './device-management/service';
import { MediaService } from './image/service';
import { ImportService } from './import/service';
import { LDAPService } from './ldap/service';
import { MessageService } from './messages/service';
import { MeteorService } from './meteor/service';
import { NPSService } from './nps/service';
import { OmnichannelIntegrationService } from './omnichannel-integrations/service';
import { OmnichannelVoipService } from './omnichannel-voip/service';
import { OmnichannelService } from './omnichannel/service';
import { PushService } from './push/service';
import { RoomService } from './room/service';
import { SAUMonitorService } from './sauMonitor/service';
import { SettingsService } from './settings/service';
import { TeamService } from './team/service';
import { TranslationService } from './translation/service';
import { UiKitCoreApp } from './uikit-core-app/service';
import { UploadService } from './upload/service';
import { VideoConfService } from './video-conference/service';
import { VoipService } from './voip/service';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

api.registerService(new AppsEngineService());
api.registerService(new AnalyticsService());
api.registerService(new AuthorizationLivechat());
api.registerService(new BannerService());
api.registerService(new CalendarService());
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
api.registerService(new ImportService());

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
