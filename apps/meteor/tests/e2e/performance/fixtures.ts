import type { CDPSession } from '@playwright/test';
import getPort from 'get-port';

import { test as baseTest } from '../utils/test';
import { openCDPSession, setCPUThrottling, setNetworkThrottling } from './collectors/cdp';
import type { LongTaskTracker } from './collectors/long-tasks';
import { startLongTaskTracking } from './collectors/long-tasks';
import type { HeapSnapshotHelper } from './collectors/memory';
import { createMemoryHelper } from './collectors/memory';
import type { WebVitalsCollector } from './collectors/web-vitals';
import { createWebVitalsCollector } from './collectors/web-vitals';
import type { LighthouseHelper } from './lighthouse';
import { createLighthouseHelper } from './lighthouse';
import type { SoftNavTracker } from './soft-navigation';
import { createSoftNavTracker } from './soft-navigation';

export type { WebVitals } from './collectors/web-vitals';
export type { LongTask, LongTaskTracker } from './collectors/long-tasks';
export type { HeapSnapshotHelper } from './collectors/memory';
export type { SoftNavMetrics, SoftNavTracker } from './soft-navigation';
export type { LighthouseResult, LighthouseHelper } from './lighthouse';

// Test-scoped performance fixtures — each is independently opt-in.
// Destructure only what a given test needs; unused fixtures are never activated.
type PerformanceFixtures = {
	/** CDP session with Performance.enable and Memory.prepareForLeakDetection already called.
	 *  Network throttling (Fast 3G) is applied automatically. */
	cdpSession: CDPSession;
	/** Captures LCP, CLS, and INP via PerformanceObserver injected before first page load. */
	webVitals: WebVitalsCollector;
	/** Before/after heap snapshot helper with warm-up and GC-before-snapshot. Depends on cdpSession. */
	heapSnapshot: HeapSnapshotHelper;
	/** Tracks soft navigation events and maps interaction-contentful-paint to Soft LCP. */
	softNavTracker: SoftNavTracker;
	/** CDP-based long task tracker. Depends on cdpSession. */
	longTaskTracker: LongTaskTracker;
	/** Worker-shared Lighthouse helper. Use newPage() to authenticate, then runAudit(). */
	lighthouseAudit: LighthouseHelper;
};

// Worker-scoped fixtures share state within a single Playwright worker process.
type WorkerFixtures = {
	lighthousePort: number;
};

export const test = baseTest.extend<PerformanceFixtures, WorkerFixtures>({
	// ── Worker-scoped ────────────────────────────────────────────────────────────
	// Acquires a guaranteed-free port once per worker to prevent address conflicts
	// when running with multiple workers or other processes using a fixed port.
	lighthousePort: [
		async (_, use) => {
			const port = await getPort();
			await use(port);
		},
		{ scope: 'worker' },
	],

	// ── Test-scoped ──────────────────────────────────────────────────────────────
	cdpSession: async ({ page }, use) => {
		const session = await openCDPSession(page);
		await setCPUThrottling(session);
		await setNetworkThrottling(session);
		await use(session);
		await session.detach();
	},

	webVitals: async ({ page }, use) => {
		const collector = await createWebVitalsCollector(page);
		await use(collector);
		// No teardown needed — observers live on the page and are collected with it.
	},

	// heapSnapshot depends on cdpSession so that Memory.prepareForLeakDetection is
	// always called before any snapshot is taken.
	heapSnapshot: async ({ cdpSession, page }, use) => {
		const helper = createMemoryHelper(cdpSession, page);
		await use(helper);
	},

	softNavTracker: async ({ page }, use) => {
		const tracker = await createSoftNavTracker(page);
		await use(tracker);
	},

	// longTaskTracker depends on cdpSession so PerformanceTimeline runs in the
	// same session as the other CDP domains.
	longTaskTracker: async ({ cdpSession }, use) => {
		const tracker = await startLongTaskTracking(cdpSession);
		await use(tracker);
	},

	lighthouseAudit: async ({ lighthousePort }, use) => {
		const helper = await createLighthouseHelper(lighthousePort);
		await use(helper);
		await helper.close();
	},
});

export { expect } from '../utils/test';
