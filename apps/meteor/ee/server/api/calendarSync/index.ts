import { CalendarSyncState } from '@rocket.chat/models';
import { validateForbiddenErrorResponse, validateUnauthorizedErrorResponse } from '@rocket.chat/rest-typings';

import {
	CalendarSyncGenericErrorSchema,
	GETCalendarSyncStatusResponseSchema,
	GETCalendarSyncUserStatusQuerySchema,
	GETCalendarSyncUserStatusResponseSchema,
	POSTCalendarSyncRunResponseSchema,
	POSTCalendarSyncTestConnectionBodySchema,
	POSTCalendarSyncTestConnectionResponseSchema,
} from './schemas';
import { settings } from '../../../../app/settings/server';
import { API } from '../../../../server/api';
import type { ExtractRoutesFromAPI } from '../../../../server/api/ApiClass';
import { getConfiguredProvider } from '../../lib/calendarSync/factory';
import { calendarSyncEngine } from '../../lib/calendarSync/startup';

const calendarSyncEndpoints = API.v1
	.post(
		'calendar-sync.test-connection',
		{
			authRequired: true,
			permissionsRequired: ['manage-calendar-sync'],
			license: ['outlook-calendar'],
			body: POSTCalendarSyncTestConnectionBodySchema,
			response: {
				200: POSTCalendarSyncTestConnectionResponseSchema,
				400: CalendarSyncGenericErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const provider = getConfiguredProvider();
			if (!provider) {
				return API.v1.failure('calendar-sync-provider-not-configured');
			}

			// testConnection never throws; it reports a sanitized, actionable error
			const connection = await provider.testConnection(this.bodyParams.probeMailbox);
			return API.v1.success({ connection });
		},
	)
	.post(
		'calendar-sync.run',
		{
			authRequired: true,
			permissionsRequired: ['manage-calendar-sync'],
			license: ['outlook-calendar'],
			response: {
				200: POSTCalendarSyncRunResponseSchema,
				400: CalendarSyncGenericErrorSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			if (!settings.get<boolean>('CalendarSync_Enabled')) {
				return API.v1.failure('calendar-sync-not-enabled');
			}
			if (!getConfiguredProvider()) {
				return API.v1.failure('calendar-sync-provider-not-configured');
			}

			// Sync runs can take minutes on large workspaces; kick it off and return.
			// Progress is visible via calendar-sync.status.
			const started = !calendarSyncEngine.isRunning();
			if (started) {
				void calendarSyncEngine.runSync();
			}

			return API.v1.success({ started });
		},
	)
	.get(
		'calendar-sync.status',
		{
			authRequired: true,
			permissionsRequired: ['manage-calendar-sync'],
			license: ['outlook-calendar'],
			response: {
				200: GETCalendarSyncStatusResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const [total, failing] = await Promise.all([
				CalendarSyncState.countDocuments({}),
				CalendarSyncState.countDocuments({ consecutiveFailures: { $gt: 0 } }),
			]);

			return API.v1.success({
				lastRun: calendarSyncEngine.getLastRunSummary(),
				states: { total, failing },
			});
		},
	)
	.get(
		'calendar-sync.user-status',
		{
			authRequired: true,
			permissionsRequired: ['manage-calendar-sync'],
			license: ['outlook-calendar'],
			query: GETCalendarSyncUserStatusQuerySchema,
			response: {
				200: GETCalendarSyncUserStatusResponseSchema,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const state = await CalendarSyncState.findOneByUserId(this.queryParams.userId);

			return API.v1.success({
				// The delta token is deliberately omitted: it is bulky transport state, not a diagnostic
				state: state && {
					uid: state.uid,
					mailbox: state.mailbox,
					provider: state.provider,
					...(state.lastSyncAt && { lastSyncAt: state.lastSyncAt }),
					...(state.lastSuccessAt && { lastSuccessAt: state.lastSuccessAt }),
					...(state.lastError && { lastError: state.lastError }),
					consecutiveFailures: state.consecutiveFailures ?? 0,
				},
			});
		},
	);

export type CalendarSyncEndpoints = ExtractRoutesFromAPI<typeof calendarSyncEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends CalendarSyncEndpoints {}
}
