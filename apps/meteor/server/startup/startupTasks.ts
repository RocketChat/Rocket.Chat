import { insertInitialData } from './initialData';
import { reportServerRunning } from './serverRunning';
import { addUiKitRateLimiter } from '../../ee/server/api/apps/uikit';
import { configureLdapEnterprise } from '../../ee/server/configuration/ldap';
import { configureOutlookCalendar } from '../../ee/server/configuration/outlookCalendar';
import { configureVideoConferenceEnterprise } from '../../ee/server/configuration/videoConference';
import { AutoCloseOnHoldScheduler } from '../../ee/server/lib/omnichannel/AutoCloseOnHoldScheduler';
import { AutoTransferChatScheduler } from '../../ee/server/lib/omnichannel/AutoTransferChatScheduler';
import { OmnichannelQueueInactivityMonitor } from '../../ee/server/lib/omnichannel/QueueInactivityMonitor';
import { syncSettingsWithLicense } from '../../ee/server/settings/settings';
import { registerHadTrialHandler } from '../../ee/server/startup/upsell';
import { startEmailInboxes } from '../features/EmailInbox/EmailInbox';
import { createAutoTranslatePermissions } from '../lib/autotranslate/permissions';
import { startCloudWorkspaceSync } from '../lib/cloud';
import { scheduleVersionCheck } from '../lib/cloud/version-check';
import { invalidateStaleImports } from '../lib/import/startup/setImportsToInvalid';
import { loadOutgoingIntegrations } from '../lib/integrations/startup';
import { registerMarkdownRenderers } from '../lib/messaging/markdown';
import { watchPrometheusSettings } from '../lib/metrics/lib/collectMetrics';
import { Notification } from '../lib/notifications/queue/NotificationQueue';
import { setupBusinessHours } from '../lib/omnichannel/business-hour';
import { startOmnichannel } from '../lib/omnichannel/startup';
import { searchProviderService } from '../lib/search/service';
import { startSessionsMonitor } from '../lib/statistics/startup/monitor';
import { removeLegacyThemeSettings } from '../settings/theme/server';
import { ensureUploadTempDirectory } from '../ufs/ufs-server';

/**
 * Runs, one after another, the work that has to wait for the whole boot (migrations, license, apps, REST) and must be done before the server
 * accepts connections.
 */
export const runStartupTasks = async (): Promise<void> => {
	ensureUploadTempDirectory();
	await invalidateStaleImports();
	await createAutoTranslatePermissions();
	registerHadTrialHandler();
	await watchPrometheusSettings();
	startSessionsMonitor();
	await startCloudWorkspaceSync();
	registerMarkdownRenderers();
	await setupBusinessHours();
	Notification.initWorker();
	void OmnichannelQueueInactivityMonitor.start();
	startEmailInboxes();
	await insertInitialData();
	await reportServerRunning();
	void AutoTransferChatScheduler.init();
	void AutoCloseOnHoldScheduler.init();
	addUiKitRateLimiter();
	await syncSettingsWithLicense();
	await configureLdapEnterprise();
	await configureOutlookCalendar();
	await configureVideoConferenceEnterprise();
	await loadOutgoingIntegrations();
	await removeLegacyThemeSettings();
	await searchProviderService.start();
	await startOmnichannel();
	scheduleVersionCheck();
};
