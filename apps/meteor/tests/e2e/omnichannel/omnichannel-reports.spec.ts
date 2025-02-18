import type { Route } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelReports } from '../page-objects/omnichannel-reports';
import { test, expect } from '../utils/test';

const ENDPOINTS = {
	BY_STATUS: /\/v1\/livechat\/analytics\/dashboards\/conversations-by-status/,
	BY_SOURCE: /\/v1\/livechat\/analytics\/dashboards\/conversations-by-source/,
	BY_DEPARTMENT: /\/v1\/livechat\/analytics\/dashboards\/conversations-by-department/,
	BY_TAGS: /\/v1\/livechat\/analytics\/dashboards\/conversations-by-tags/,
	BY_AGENT: /\/v1\/livechat\/analytics\/dashboards\/conversations-by-agent/,
};

test.skip(!IS_EE, 'Omnichannel Reports > Enterprise Only');

test.use({ storageState: Users.user1.state });

test.describe.serial('Omnichannel Reports', () => {
	let poReports: OmnichannelReports;

	test.beforeAll(async ({ api }) => {
		const requests = await Promise.all([
			api.post('/livechat/users/agent', { username: 'user1' }),
			api.post('/livechat/users/manager', { username: 'user1' }),
		]);
		await expect(requests.every((request) => request.status() === 200)).toBe(true);
	});

	test.beforeEach(async ({ page }) => {
		poReports = new OmnichannelReports(page);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/omnichannel/reports');
		await page.locator('.main-content').waitFor();
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([api.delete('/livechat/users/agent/user1'), api.delete('/livechat/users/manager/user1')]);
	});

	test('Status Section', async ({ page }) => {
		await test.step('Empty state', async () => {
			await page.route(ENDPOINTS.BY_STATUS, async (route: Route) => {
				await route.fulfill({ json: { data: [], total: 0 } });
			});

			await poReports.statusSection.selectPeriod('this week');
			await expect(poReports.statusSection.txtStateTitle).toHaveText('No data available for the selected period');
			await expect(poReports.statusSection.txtStateSubtitle).toHaveText('This chart will update as soon as conversations start.');
			await expect(poReports.statusSection.txtSummary).toHaveText('0 conversations, this week');
		});

		await test.step('Error state', async () => {
			await page.route(ENDPOINTS.BY_STATUS, async (route: Route) => {
				await route.abort();
			});

			await poReports.statusSection.selectPeriod('this month');
			await expect(poReports.statusSection.element).toHaveAttribute('aria-busy', 'false');
			await expect(poReports.statusSection.btnRetry).toBeVisible();
			await expect(poReports.statusSection.txtStateTitle).toHaveText('Something went wrong');

			await test.step('Retry', async () => {
				await page.route(ENDPOINTS.BY_STATUS, async (route: Route) => {
					await route.fulfill({ json: { data: [], total: 0 } });
				});

				const responsePromise = page.waitForResponse(ENDPOINTS.BY_STATUS);
				await poReports.statusSection.btnRetry.click();
				await responsePromise;
			});
		});

		await test.step('Render data', async () => {
			const mock = {
				data: [
					{ label: 'Open', value: 25 },
					{ label: 'Queued', value: 25 },
					{ label: 'Closed', value: 25 },
					{ label: 'On_Hold', value: 25 },
				],
				total: 100,
			};

			await page.route(ENDPOINTS.BY_STATUS, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.statusSection.selectPeriod('this year');
			await expect(poReports.statusSection.legendItem(`Closed 25 (25%)`)).toBeVisible();
			await expect(poReports.statusSection.legendItem(`Open 25 (25%)`)).toBeVisible();
			await expect(poReports.statusSection.legendItem(`Queued 25 (25%)`)).toBeVisible();
			await expect(poReports.statusSection.legendItem(`On hold 25 (25%)`)).toBeVisible();
			await expect(poReports.statusSection.txtSummary).toHaveText('100 conversations, this year');
		});
	});

	test('Channels Section', async ({ page }) => {
		await test.step('Empty state', async () => {
			await page.route(ENDPOINTS.BY_SOURCE, async (route: Route) => {
				await route.fulfill({ json: { data: [], total: 0 } });
			});

			await poReports.channelsSection.selectPeriod('this week');
			await expect(poReports.channelsSection.txtStateTitle).toHaveText('No data available for the selected period');
			await expect(poReports.channelsSection.txtStateSubtitle).toHaveText('This chart shows the most used channels.');
			await expect(poReports.channelsSection.txtSummary).toHaveText('0 conversations, this week');
		});

		await test.step('Error state', async () => {
			await page.route(ENDPOINTS.BY_SOURCE, async (route: Route) => {
				await route.abort();
			});

			await poReports.channelsSection.selectPeriod('last 15 days');
			await expect(poReports.channelsSection.element).toHaveAttribute('aria-busy', 'false');
			await expect(poReports.channelsSection.btnRetry).toBeVisible();
			await expect(poReports.channelsSection.txtStateTitle).toHaveText('Something went wrong');

			await test.step('Retry', async () => {
				await page.route(ENDPOINTS.BY_SOURCE, async (route: Route) => {
					await route.fulfill({ json: { data: [], total: 0 } });
				});

				const responsePromise = page.waitForResponse(ENDPOINTS.BY_SOURCE);
				await poReports.channelsSection.btnRetry.click();
				await responsePromise;
			});
		});

		await test.step('Render data', async () => {
			const mock = {
				data: [
					{ label: 'Channel 1', value: 50 },
					{ label: 'Channel 2', value: 50 },
				],
				total: 100,
			};
			await page.route(ENDPOINTS.BY_SOURCE, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.channelsSection.selectPeriod('this year');
			await expect(poReports.channelsSection.legendItem(`Channel 1 50 (50%)`)).toBeVisible();
			await expect(poReports.channelsSection.legendItem(`Channel 2 50 (50%)`)).toBeVisible();
			await expect(poReports.channelsSection.txtSummary).toHaveText('100 conversations, this year');
		});

		await test.step('More than 5 channels', async () => {
			const mock = {
				data: [
					{ label: 'Channel 1', value: 15 },
					{ label: 'Channel 2', value: 15 },
					{ label: 'Channel 3', value: 15 },
					{ label: 'Channel 4', value: 15 },
					{ label: 'Channel 5', value: 15 },
					{ label: 'Channel 6', value: 15 },
					{ label: 'Channel 7', value: 15 },
					{ label: 'Channel 8', value: 15 },
				],
				total: 120,
			};
			await page.route(ENDPOINTS.BY_SOURCE, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.channelsSection.selectPeriod('last 6 months');
			await expect(poReports.channelsSection.legendItem(`Others 45 (37.5%)`)).toBeVisible();
			await expect(poReports.channelsSection.txtSummary).toHaveText('120 conversations, last 6 months');
		});
	});

	test('Departments Section', async ({ page }) => {
		await test.step('Empty state', async () => {
			await page.route(ENDPOINTS.BY_DEPARTMENT, async (route: Route) => {
				await route.fulfill({ json: { data: [], total: 0 } });
			});

			await poReports.departmentsSection.selectPeriod('this week');
			await expect(poReports.departmentsSection.txtStateTitle).toHaveText('No data available for the selected period');
			await expect(poReports.departmentsSection.txtStateSubtitle).toHaveText(
				'This chart displays the departments that receive the most conversations.',
			);
			await expect(poReports.departmentsSection.txtSummary).toHaveText('0 departments and 0 conversations, this week');
		});

		await test.step('Error state', async () => {
			await page.route(ENDPOINTS.BY_DEPARTMENT, async (route: Route) => {
				await route.abort();
			});

			await poReports.departmentsSection.selectPeriod('this month');
			await expect(poReports.departmentsSection.element).toHaveAttribute('aria-busy', 'false');
			await expect(poReports.departmentsSection.btnRetry).toBeVisible();
			await expect(poReports.departmentsSection.txtStateTitle).toHaveText('Something went wrong');

			await test.step('Retry', async () => {
				await page.route(ENDPOINTS.BY_DEPARTMENT, async (route: Route) => {
					await route.fulfill({ json: { data: [], total: 0 } });
				});

				const responsePromise = page.waitForResponse(ENDPOINTS.BY_DEPARTMENT);
				await poReports.departmentsSection.btnRetry.click();
				await responsePromise;
			});
		});

		await test.step('Render data', async () => {
			const mock = {
				data: [
					{ label: 'Department 1', value: 10 },
					{ label: 'Department 2', value: 20 },
					{ label: 'Department 3', value: 30 },
					{ label: 'Department 4', value: 40 },
				],
				total: 100,
				unspecified: 42,
			};
			await page.route(ENDPOINTS.BY_DEPARTMENT, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.departmentsSection.selectPeriod('last 6 months');
			await expect(poReports.departmentsSection.chartItem('Department 1', 10)).toBeVisible();
			await expect(poReports.departmentsSection.chartItem('Department 2', 20)).toBeVisible();
			await expect(poReports.departmentsSection.chartItem('Department 3', 30)).toBeVisible();
			await expect(poReports.departmentsSection.chartItem('Department 4', 40)).toBeVisible();
			await expect(poReports.departmentsSection.txtSummary).toHaveText(
				'4 departments and 100 conversations, last 6 months (42 without department)',
			);
		});
	});

	test('Tags Section', async ({ page }) => {
		await test.step('Empty state', async () => {
			await page.route(ENDPOINTS.BY_TAGS, async (route: Route) => {
				await route.fulfill({ json: { data: [], total: 0 } });
			});

			await poReports.tagsSection.selectPeriod('this week');
			await expect(poReports.tagsSection.txtStateTitle).toHaveText('No data available for the selected period');
			await expect(poReports.tagsSection.txtStateSubtitle).toHaveText('This chart shows the most frequently used tags.');
			await expect(poReports.tagsSection.txtSummary).toHaveText('0 tags and 0 conversations, this week');
		});

		await test.step('Error state', async () => {
			await page.route(ENDPOINTS.BY_TAGS, async (route: Route) => {
				await route.abort();
			});

			await poReports.tagsSection.selectPeriod('this month');
			await expect(poReports.tagsSection.element).toHaveAttribute('aria-busy', 'false');
			await expect(poReports.tagsSection.btnRetry).toBeVisible();
			await expect(poReports.tagsSection.txtStateTitle).toHaveText('Something went wrong');

			await test.step('Retry', async () => {
				await page.route(ENDPOINTS.BY_TAGS, async (route: Route) => {
					await route.fulfill({ json: { data: [], total: 0 } });
				});

				const responsePromise = page.waitForResponse(ENDPOINTS.BY_TAGS);
				await poReports.tagsSection.btnRetry.click();
				await responsePromise;
			});
		});

		await test.step('Render data', async () => {
			const mock = {
				data: [
					{ label: 'Tag 1', value: 10 },
					{ label: 'Tag 2', value: 20 },
					{ label: 'Tag 3', value: 30 },
					{ label: 'Tag 4', value: 40 },
				],
				total: 100,
				unspecified: 42,
			};
			await page.route(ENDPOINTS.BY_TAGS, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.tagsSection.selectPeriod('last 6 months');
			await expect(poReports.tagsSection.chartItem('Tag 1', 10)).toBeVisible();
			await expect(poReports.tagsSection.chartItem('Tag 2', 20)).toBeVisible();
			await expect(poReports.tagsSection.chartItem('Tag 3', 30)).toBeVisible();
			await expect(poReports.tagsSection.chartItem('Tag 4', 40)).toBeVisible();
			await expect(poReports.tagsSection.txtSummary).toHaveText('4 tags and 100 conversations, last 6 months (42 without tags)');
		});
	});

	test('Agents Section', async ({ page }) => {
		await test.step('Empty state', async () => {
			await page.route(ENDPOINTS.BY_AGENT, async (route: Route) => {
				await route.fulfill({ json: { data: [], total: 0 } });
			});

			await poReports.agentsSection.selectPeriod('this week');
			await expect(poReports.agentsSection.txtStateTitle).toHaveText('No data available for the selected period');
			await expect(poReports.agentsSection.txtStateSubtitle).toHaveText(
				'This chart displays which agents receive the highest volume of conversations.',
			);
			await expect(poReports.agentsSection.txtSummary).toHaveText('0 agents and 0 conversations, this week');
		});

		await test.step('Error state', async () => {
			await page.route(ENDPOINTS.BY_AGENT, async (route: Route) => {
				await route.abort();
			});

			await poReports.agentsSection.selectPeriod('this month');
			await expect(poReports.agentsSection.element).toHaveAttribute('aria-busy', 'false');
			await expect(poReports.agentsSection.btnRetry).toBeVisible();
			await expect(poReports.agentsSection.txtStateTitle).toHaveText('Something went wrong');

			await test.step('Retry', async () => {
				await page.route(ENDPOINTS.BY_AGENT, async (route: Route) => {
					await route.fulfill({ json: { data: [], total: 0 } });
				});

				const responsePromise = page.waitForResponse(ENDPOINTS.BY_AGENT);
				await poReports.agentsSection.btnRetry.click();
				await responsePromise;
			});
		});

		await test.step('Render data', async () => {
			const mock = {
				data: [
					{ label: 'Agent 1', value: 10 },
					{ label: 'Agent 2', value: 20 },
					{ label: 'Agent 3', value: 30 },
					{ label: 'Agent 4', value: 40 },
				],
				total: 100,
				unspecified: 42,
			};
			await page.route(ENDPOINTS.BY_AGENT, async (route: Route) => {
				const response = await route.fetch();
				await route.fulfill({ response, json: mock });
			});

			await poReports.agentsSection.selectPeriod('last 6 months');

			await expect(poReports.agentsSection.txtSummary).toHaveText('4 agents and 100 conversations, last 6 months (42 without assignee)');

			await expect(poReports.agentsSection.chartItem('Agent 1', 10)).toBeVisible();
			await expect(poReports.agentsSection.chartItem('Agent 2', 20)).toBeVisible();
			await expect(poReports.agentsSection.chartItem('Agent 3', 30)).toBeVisible();
			await expect(poReports.agentsSection.chartItem('Agent 4', 40)).toBeVisible();

			await expect(poReports.agentsSection.findRowByName('Agent 1')).toBeVisible();
			await expect(poReports.agentsSection.findRowByName('Agent 2')).toBeVisible();
			await expect(poReports.agentsSection.findRowByName('Agent 3')).toBeVisible();
			await expect(poReports.agentsSection.findRowByName('Agent 4')).toBeVisible();
		});
	});
});
