import { faker } from '@faker-js/faker';

import { BASE_URL } from './config/constants';
import { createAuxContext } from './fixtures/createAuxContext';
import { Users, restoreState } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { getMetrics } from './performance/collectors/cdp';
import { test, expect } from './performance/fixtures';
import { assertWithinBaseline } from './performance/reporter/baseline';
import { createTargetChannel, deleteChannel } from './utils';

const MY_SUITE = 'messaging-perf';

test.describe('Messaging Performance', () => {
	test.use({ storageState: Users.user1.state });
	let targetChannel: string;
	let secondChannel: string;

	test.beforeAll(async ({ api }) => {
		[targetChannel, secondChannel] = await Promise.all([createTargetChannel(api), createTargetChannel(api)]);

		// Seed a message so the channel has visible content for LCP measurement
		await api.post('/chat.postMessage', { channel: targetChannel, text: 'perf-seed' });
	});

	test.afterAll(async ({ api }) => {
		await Promise.all([deleteChannel(api, targetChannel), deleteChannel(api, secondChannel)]);
	});

	test.beforeEach(async ({ page }) => {
		await page.goto('/home');
	});

	// ── 1. Core Web Vitals ──────────────────────────────────────────────────────
	// webVitals injects a PerformanceObserver before the first byte of the page
	// loads, so navigating to the channel after fixture setup captures the full
	// LCP / CLS / INP for that user journey.
	test('channel open — Core Web Vitals (LCP, CLS, INP)', async ({ page, webVitals }) => {
		const po = new HomeChannel(page);
		await po.navbar.openChat(targetChannel);
		await expect(po.content.lastUserMessageBody).toBeVisible();

		const vitals = await webVitals.getVitals();

		expect(vitals.CLS, 'CLS must stay below the "Good" threshold').toBeLessThan(0.1);

		if (vitals.LCP !== null) assertWithinBaseline(MY_SUITE, 'channel-open-lcp', vitals.LCP);
		if (vitals.INP !== null) assertWithinBaseline(MY_SUITE, 'channel-open-inp', vitals.INP);
		assertWithinBaseline(MY_SUITE, 'channel-open-cls', vitals.CLS);
	});

	// ── 2. Send message — CDP metrics and long tasks ────────────────────────────
	// Captures layout recalculations and JS long tasks (>50ms) triggered by a
	// single message send, using the same CDP session for both.
	test('send message — layout count and long tasks', async ({ page, cdpSession, longTaskTracker }) => {
		const po = new HomeChannel(page);
		await po.navbar.openChat(targetChannel);
		await expect(po.content.lastUserMessageBody).toBeVisible();

		const before = await getMetrics(cdpSession);
		longTaskTracker.reset();

		const text = faker.lorem.sentence();
		await po.content.sendMessage(text);
		await expect(po.content.lastUserMessageBody).toHaveText(text);

		const after = await getMetrics(cdpSession);
		const tasks = longTaskTracker.getLongTasks();

		const layoutsTriggered = after.LayoutCount - before.LayoutCount;
		const totalLongTaskMs = tasks.reduce((sum, t) => sum + t.duration, 0);

		test.info().annotations.push({
			type: 'perf-send',
			description: JSON.stringify({ layoutsTriggered, longTaskCount: tasks.length, totalLongTaskMs }),
		});

		assertWithinBaseline(MY_SUITE, 'send-layouts', layoutsTriggered);
		assertWithinBaseline(MY_SUITE, 'send-long-task-count', tasks.length);
		assertWithinBaseline(MY_SUITE, 'send-total-long-task-ms', totalLongTaskMs);
	});

	// ── 3. Receive message — render latency and heap growth ─────────────────────
	// Posts a message via the REST API (simulating a remote sender) and measures
	// how long it takes for the message to appear in the receiving user's view.
	test('receive message — render latency and heap growth', async ({ page, browser, api, cdpSession, longTaskTracker }) => {
		const { page: auxPage } = await createAuxContext(browser, Users.user2);

		try {
			const po = new HomeChannel(page);
			await po.navbar.openChat(targetChannel);
			await expect(po.content.lastUserMessageBody).toBeVisible();

			const before = await getMetrics(cdpSession);
			longTaskTracker.reset();
			const t0 = Date.now();

			const text = faker.lorem.sentence();
			await api.post('/chat.postMessage', { channel: targetChannel, text });
			await expect(po.content.lastUserMessageBody).toHaveText(text);

			const renderLatencyMs = Date.now() - t0;
			const after = await getMetrics(cdpSession);
			const tasks = longTaskTracker.getLongTasks();

			test.info().annotations.push({
				type: 'perf-receive',
				description: JSON.stringify({
					renderLatencyMs,
					longTaskCount: tasks.length,
					heapGrowthKB: Math.round((after.JSHeapUsedSize - before.JSHeapUsedSize) / 1024),
				}),
			});

			assertWithinBaseline(MY_SUITE, 'receive-render-ms', renderLatencyMs);
			assertWithinBaseline(MY_SUITE, 'receive-long-task-count', tasks.length);
		} finally {
			await auxPage.close();
		}
	});

	// ── 4. Channel switch — Soft Navigation metrics ─────────────────────────────
	// The Soft Navigation API (enabled via --enable-experimental-web-platform-features)
	// tracks client-side route changes as "soft navigations" and maps
	// interaction-contentful-paint entries to a per-route "Soft LCP".
	test('channel switch — Soft Navigation Soft LCP and duration', async ({ page, softNavTracker, longTaskTracker, cdpSession }) => {
		const po = new HomeChannel(page);

		// Open first channel (hard navigation — baseline, not a soft nav)
		await po.navbar.openChat(targetChannel);
		await expect(po.content.lastUserMessageBody).toBeVisible();

		longTaskTracker.reset();

		// Switch to second channel — SPA client-side route change
		await po.navbar.openChat(secondChannel);

		const navs = await softNavTracker.getNavigations();
		const tasks = longTaskTracker.getLongTasks();
		const after = await getMetrics(cdpSession);

		if (navs.length > 0) {
			const nav = navs[navs.length - 1];

			test.info().annotations.push({
				type: 'perf-soft-nav',
				description: JSON.stringify({ softLCP: nav.softLCP, duration: nav.duration, CLS: nav.CLS }),
			});

			if (nav.softLCP !== null) assertWithinBaseline(MY_SUITE, 'switch-soft-lcp', nav.softLCP);
			assertWithinBaseline(MY_SUITE, 'switch-duration', nav.duration);
		}

		assertWithinBaseline(MY_SUITE, 'switch-long-task-count', tasks.length);
		assertWithinBaseline(MY_SUITE, 'switch-recalc-style-count', after.RecalcStyleCount);
	});

	// ── 5. Repeated sends — memory leak detection ───────────────────────────────
	// Runs a message-send journey 5 times with a warm-up pass, forcing GC before
	// each "after" snapshot. A heap growth > 5 MB across the iterations fails.
	test('repeated sends — memory leak detection', async ({ page, heapSnapshot }) => {
		const po = new HomeChannel(page);
		await po.navbar.openChat(targetChannel);
		await expect(po.content.lastUserMessageBody).toBeVisible();

		await heapSnapshot.detectLeak(
			async (p) => {
				const journey = new HomeChannel(p);
				const text = faker.lorem.sentence();
				await journey.content.sendMessage(text);
				await expect(journey.content.lastUserMessageBody).toHaveText(text);
			},
			{ iterations: 5, thresholdBytes: 5 * 1024 * 1024 },
		);
	});

	// ── 6. Lighthouse audit — authenticated channel page ────────────────────────
	// The Lighthouse fixture launches a separate Chromium instance on a dynamically
	// acquired port. restoreState injects the pre-generated auth token into
	// localStorage before the audit so Lighthouse sees an authenticated session.
	// disableStorageReset:true in the fixture preserves that state.
	test('Lighthouse audit — channel page performance score', async ({ lighthouseAudit }) => {
		const lhPage = await lighthouseAudit.newPage();

		// Navigate to the app origin first so localStorage is accessible, then inject
		// user1's pre-generated token. A subsequent navigation picks up the auth state.
		await lhPage.goto(BASE_URL);
		await restoreState(lhPage, Users.user1);
		await lhPage.goto(`${BASE_URL}/channel/${targetChannel}`);
		await lhPage.waitForLoadState('networkidle');

		const result = await lighthouseAudit.runAudit(`${BASE_URL}/channel/${targetChannel}`);

		const perfScore = (result.lhr.categories.performance?.score ?? 0) * 100;
		const lcp = result.lhr.audits['largest-contentful-paint']?.numericValue ?? 0;
		const tbt = result.lhr.audits['total-blocking-time']?.numericValue ?? 0;
		const cls = result.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0;

		test.info().annotations.push({
			type: 'lighthouse',
			description: JSON.stringify({ perfScore, lcp, tbt, cls }),
		});

		assertWithinBaseline(MY_SUITE, 'lighthouse-score', perfScore);
		assertWithinBaseline(MY_SUITE, 'lighthouse-lcp', lcp);
		assertWithinBaseline(MY_SUITE, 'lighthouse-tbt', tbt);
	});
});
