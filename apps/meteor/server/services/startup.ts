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
import { OmnichannelService } from './omnichannel/service';
import { OmnichannelAnalyticsService } from './omnichannel-analytics/service';
import { OmnichannelIntegrationService } from './omnichannel-integrations/service';
import { OmnichannelVoipService } from './omnichannel-voip/service';
import { PushService } from './push/service';
import { RoomService } from './room/service';
import { SAUMonitorService } from './sauMonitor/service';
import { TeamService } from './team/service';
import { TranslationService } from './translation/service';
import { UiKitCoreAppService } from './uikit-core-app/service';
import { UploadService } from './upload/service';
import { UserService } from './user/service';
import { VideoConfService } from './video-conference/service';
import { VoipAsteriskService } from './voip-asterisk/service';
import { SettingsService } from './settings/service';
import { startFederationService } from '../../ee/server/startup/services';

export const registerServices = async (): Promise<void> => {
	const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

	api.registerService(new SettingsService());
	api.registerService(new OmnichannelIntegrationService());
	api.registerService(new AppsEngineService(), []);
	api.registerService(new AnalyticsService(), []);
	api.registerService(new AuthorizationLivechat(), []);
	api.registerService(new BannerService(), []);
	api.registerService(new CalendarService(), ['settings']);
	api.registerService(new LDAPService(), ['settings']);

	api.registerService(new MediaService(), ['settings']);
	api.registerService(new MeteorService(), ['settings']);
	api.registerService(new NPSService(), ['settings']);
	api.registerService(new RoomService(), ['settings']);
	api.registerService(new SAUMonitorService(), ['settings']);
	api.registerService(new VoipAsteriskService(db), ['settings']);
	api.registerService(new OmnichannelService(), ['settings']);
	api.registerService(new OmnichannelVoipService(), ['settings']);
	api.registerService(new TeamService(), ['settings']);
	api.registerService(new UiKitCoreAppService(), ['settings']);
	api.registerService(new PushService(), ['settings']);
	api.registerService(new DeviceManagementService(), ['settings']);
	api.registerService(new VideoConfService(), ['settings']);
	api.registerService(new UploadService(), ['settings']);
	api.registerService(new MessageService(), ['settings']);
	api.registerService(new TranslationService(), ['settings']);
	api.registerService(new OmnichannelIntegrationService(), ['settings']);
	api.registerService(new ImportService(), ['settings']);
	api.registerService(new OmnichannelAnalyticsService(), ['settings']);
	api.registerService(new UserService(), ['settings']);

	// FIXME: This should be removed
	await startFederationService();

	// if the process is running in micro services mode we don't need to register services that will run separately
	if (!isRunningMs()) {
		const { Presence } = await import('@rocket.chat/presence');

		const { Authorization } = await import('./authorization/service');

		api.registerService(new Presence(), ['settings']);
		api.registerService(new Authorization(), ['settings']);

		// Run EE services defined outside of the main repo
		// Otherwise, monolith would ignore them :(
		// Always register the service and manage licensing inside the service (tbd)
		api.registerService(new QueueWorker(db, Logger), ['settings']);
		api.registerService(new OmnichannelTranscript(Logger), ['settings']);
	}

	await api.start();
};
