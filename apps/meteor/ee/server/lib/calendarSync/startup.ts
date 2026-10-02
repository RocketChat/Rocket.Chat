import { cronJobs } from '@rocket.chat/cron';
import { Logger } from '@rocket.chat/logger';
import { CalendarSyncState, Permissions } from '@rocket.chat/models';

import { CalendarSyncEngine } from './CalendarSyncEngine';
import type { ICalendarSyncEngineConfig } from './CalendarSyncEngine';
import { getConfiguredProvider } from './factory';
import { settings } from '../../../../server/settings';

const JOB_NAME = 'calendar-sync';

const logger = new Logger('CalendarSync');

function getWebhookUrl(): string {
	const siteUrl = (settings.get<string>('Site_Url') || '').replace(/\/+$/, '');
	// Microsoft only delivers notifications to public HTTPS endpoints
	if (!siteUrl.startsWith('https://')) {
		return '';
	}
	return `${siteUrl}/api/v1/calendar-sync.webhook`;
}

function getEngineConfig(): ICalendarSyncEngineConfig {
	return {
		mode: settings.get<ICalendarSyncEngineConfig['mode']>('CalendarSync_Mode') || 'full-events',
		windowDays: Math.max(1, settings.get<number>('CalendarSync_Window_Days') || 7),
		batchSize: Math.max(1, settings.get<number>('CalendarSync_Batch_Size') || 10),
		presenceEnabled: settings.get<boolean>('CalendarSync_Presence_Enabled') ?? true,
		mailboxSource: settings.get<string>('CalendarSync_Mailbox_Source') === 'custom-field' ? 'custom-field' : 'email',
		mailboxCustomField: settings.get<string>('CalendarSync_Mailbox_CustomField') || '',
		defaultLanguage: settings.get<string>('Language') || 'en',
		roles: (settings.get<string>('CalendarSync_User_Roles') || '')
			.split(',')
			.map((role) => role.trim())
			.filter(Boolean),
		webhooksEnabled: settings.get<boolean>('CalendarSync_Webhooks_Enabled') === true,
		webhookUrl: getWebhookUrl(),
	};
}

export const calendarSyncEngine = new CalendarSyncEngine(getConfiguredProvider, getEngineConfig, logger);

export async function createPermissions(): Promise<void> {
	await Permissions.create('manage-calendar-sync', ['admin']);
}

async function deployJob(): Promise<void> {
	const enabled = settings.get<boolean>('CalendarSync_Enabled');
	const interval = Math.max(1, settings.get<number>('CalendarSync_Interval') || 5);

	if (await cronJobs.has(JOB_NAME)) {
		await cronJobs.remove(JOB_NAME);
	}

	if (!enabled) {
		return;
	}

	await cronJobs.add(JOB_NAME, `${interval} minutes`, async () => {
		await calendarSyncEngine.runSync();
	});
	logger.info(`Calendar sync job scheduled every ${interval} minute(s)`);
}

/**
 * Settings whose change invalidates all per-user sync state (delta tokens would
 * refer to another mailbox/provider or carry the wrong privacy footprint).
 */
const STATE_RESET_SETTINGS = [
	'CalendarSync_Provider',
	'CalendarSync_Mode',
	'CalendarSync_Presence_Enabled',
	'CalendarSync_Mailbox_Source',
	'CalendarSync_Mailbox_CustomField',
	'CalendarSync_Graph_Cloud',
];

const JOB_SETTINGS = ['CalendarSync_Enabled', 'CalendarSync_Interval'];

export async function configureCalendarSync(): Promise<void> {
	const snapshot = new Map<string, unknown>(STATE_RESET_SETTINGS.map((id) => [id, settings.get(id)]));

	settings.watchMultiple([...JOB_SETTINGS, ...STATE_RESET_SETTINGS], async () => {
		let stateReset = false;
		for (const id of STATE_RESET_SETTINGS) {
			const value = settings.get(id);
			if (snapshot.get(id) !== value) {
				snapshot.set(id, value);
				stateReset = true;
			}
		}

		if (stateReset) {
			logger.info('Calendar sync configuration changed; resetting per-user sync state to force a full resync');
			await CalendarSyncState.removeAll();
		}

		await deployJob();
	});

	await deployJob();
}
