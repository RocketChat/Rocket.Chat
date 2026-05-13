import type { CDPSession, Page } from '@playwright/test';

import { collectGarbage } from './cdp';

export interface IHeapSnapshotHelper {
	snapshot(): Promise<number>;
	detectLeak(journey: (page: Page) => Promise<void>, options?: { iterations?: number; thresholdBytes?: number }): Promise<void>;
}

// Returns current usedJSHeapSize. Requires Memory.prepareForLeakDetection to have been
// called on the session (done by openCDPSession in cdp.ts).
async function snapshot(session: CDPSession): Promise<number> {
	await collectGarbage(session);
	const result = (await session.send('Performance.getMetrics')) as { metrics: Array<{ name: string; value: number }> };
	const entry = result.metrics.find((m) => m.name === 'JSHeapUsedSize');
	return entry?.value ?? 0;
}

export function createMemoryHelper(session: CDPSession, page: Page): IHeapSnapshotHelper {
	return {
		snapshot: () => snapshot(session),

		async detectLeak(journey: (page: Page) => Promise<void>, { iterations = 5, thresholdBytes = 5 * 1024 * 1024 } = {}): Promise<void> {
			// Warm-up run: ensures lazy-loaded modules and one-time caches are already
			// resident in memory so they are not mistakenly flagged as a leak.
			await journey(page);

			const before = await snapshot(session);

			for (let i = 0; i < iterations; i++) {
				await journey(page);
			}

			const after = await snapshot(session);
			const growth = after - before;

			if (growth > thresholdBytes) {
				throw new Error(
					`Memory leak detected: heap grew by ${(growth / 1024 / 1024).toFixed(2)} MB ` +
						`over ${iterations} iterations (threshold: ${(thresholdBytes / 1024 / 1024).toFixed(2)} MB)`,
				);
			}
		},
	};
}
