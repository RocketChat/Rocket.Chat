import type { CalendarEventImportProps } from '@rocket.chat/rest-typings';

import { IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { test, expect, type BaseTest } from './utils/test';

test.skip(!IS_EE, 'Calendar tests are only available in EE');

test.use({ storageState: Users.admin.state });

test.describe('Calendar', () => {
	test.beforeAll(async ({ api }) => {
		expect((await api.post('/settings/Calendar_BusyStatus_Enabled', { value: true })).status()).toBe(200);
	});

	test.afterAll(async ({ api }) => {
		expect((await api.post('/settings/Calendar_BusyStatus_Enabled', { value: false })).status()).toBe(200);
	});

	test.describe('Status changes', () => {
		test.beforeEach(async ({ page, api }) => {
			expect((await api.post('/users.setStatus', { status: 'away', message: '' })).status()).toBe(200);
			await page.goto('/home');
		});

		test(
			'Should change user status back to away when there are overlapping imported events',
			{
				tag: '@status',
				annotation: {
					type: 'issue',
					description: 'https://rocketchat.atlassian.net/browse/CORE-1079',
				},
			},
			async ({ page, api }) => {
				await expect(page.getByRole('button', { name: 'User menu' }).getByRole('status')).toHaveAccessibleName('away');

				const event1 = await importCalendarEvent(api, { start: 10, end: 20 });
				const event2 = await importCalendarEvent(api, { start: 15, end: 25 });

				await test.step('Should change status to busy', async () => {
					await expect(page.getByRole('button', { name: 'User menu' }).getByRole('status')).toHaveAccessibleName('busy', {
						timeout: event1.endTime.getTime() - Date.now(),
					});
				});

				await test.step('Should change status to away again', async () => {
					await expect(page.getByRole('button', { name: 'User menu' }).getByRole('status')).toHaveAccessibleName('away', {
						timeout: event2.endTime.getTime() - Date.now() + 1000,
					});
				});
			},
		);
	});
});

async function importCalendarEvent(api: BaseTest['api'], { now = Date.now(), start = 2, end = 4 } = {}) {
	const startTime = new Date(now + 1000 * start);
	const endTime = new Date(now + 1000 * end);

	const apiResponse = await api.post('/calendar-events.import', {
		startTime: startTime.toISOString(),
		endTime: endTime.toISOString(),
		subject: 'Test appointment',
		description: 'Test appointment description',
		meetingUrl: 'https://rocket.chat/',
		busy: true,
		externalId: `test-${start}-${end}-${now}`,
	} satisfies CalendarEventImportProps);

	expect(apiResponse.status()).toBe(200);

	const { id } = await apiResponse.json();

	if (typeof id !== 'string') {
		throw new Error(`Expected id to be a string, but got ${typeof id}`);
	}

	return { startTime, endTime, now, id };
}
