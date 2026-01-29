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
import { MediaCallService } from './media-call/service';
import { MessageService } from './messages/service';
import { MeteorService } from './meteor/service';
import { NPSService } from './nps/service';
import { OmnichannelService } from './omnichannel/service';
import { OmnichannelAnalyticsService } from './omnichannel-analytics/service';
import { OmnichannelIntegrationService } from './omnichannel-integrations/service';
import { PushService } from './push/service';
import { RoomService } from './room/service';
import { SAUMonitorService } from './sauMonitor/service';
import { SettingsService } from './settings/service';
import { TeamService } from './team/service';
import { UiKitCoreAppService } from './uikit-core-app/service';
import { UploadService } from './upload/service';
import { UserService } from './user/service';
import { VideoConfService } from './video-conference/service';
import { i18n } from '../lib/i18n';

const registerWithDiagnostics = (name: string, factory: () => unknown): void => {
	try {
		api.registerService(factory());
	} catch (error) {
		Logger.error({ service: name, err: error }, 'Service registration failed');
		throw error;
	}
};

export const registerServices = async (): Promise<void> => {
	const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

	registerWithDiagnostics('AppsEngineService', () => new AppsEngineService());
	registerWithDiagnostics('AnalyticsService', () => new AnalyticsService());
	registerWithDiagnostics('AuthorizationLivechat', () => new AuthorizationLivechat());
	registerWithDiagnostics('BannerService', () => new BannerService());
	registerWithDiagnostics('CalendarService', () => new CalendarService());
	registerWithDiagnostics('LDAPService', () => new LDAPService());
	registerWithDiagnostics('MediaService', () => new MediaService());
	registerWithDiagnostics('MeteorService', () => new MeteorService());
	registerWithDiagnostics('NPSService', () => new NPSService());
	registerWithDiagnostics('RoomService', () => new RoomService());
	registerWithDiagnostics('SAUMonitorService', () => new SAUMonitorService());
	registerWithDiagnostics('OmnichannelService', () => new OmnichannelService());
	registerWithDiagnostics('TeamService', () => new TeamService());
	registerWithDiagnostics('UiKitCoreAppService', () => new UiKitCoreAppService());
	registerWithDiagnostics('PushService', () => new PushService());
	registerWithDiagnostics('DeviceManagementService', () => new DeviceManagementService());
	registerWithDiagnostics('VideoConfService', () => new VideoConfService());
	registerWithDiagnostics('UploadService', () => new UploadService());
	registerWithDiagnostics('MessageService', () => new MessageService());
	registerWithDiagnostics('SettingsService', () => new SettingsService());
	registerWithDiagnostics('OmnichannelIntegrationService', () => new OmnichannelIntegrationService());
	registerWithDiagnostics('ImportService', () => new ImportService());
	registerWithDiagnostics('OmnichannelAnalyticsService', () => new OmnichannelAnalyticsService());
	registerWithDiagnostics('UserService', () => new UserService());
	registerWithDiagnostics('MediaCallService', () => new MediaCallService());

	// if the process is running in micro services mode we don't need to register services that will run separately
	if (!isRunningMs()) {
		const { Presence } = await import('@rocket.chat/presence');

		const { Authorization } = await import('./authorization/service');

		registerWithDiagnostics('Presence', () => new Presence());
		registerWithDiagnostics('Authorization', () => new Authorization());

		// Run EE services defined outside of the main repo
		// Otherwise, monolith would ignore them :(
		// Always register the service and manage licensing inside the service (tbd)
		registerWithDiagnostics('QueueWorker', () => new QueueWorker(db, Logger));
		registerWithDiagnostics('OmnichannelTranscript', () => new OmnichannelTranscript(Logger, i18n));
	}
};
