import type { Page } from '@playwright/test';
import { test } from '@playwright/test';

export interface WebVitals {
	LCP: number | null;
	CLS: number;
	INP: number | null;
}

export interface WebVitalsCollector {
	getVitals(): Promise<WebVitals>;
}

// Injected into the page via addInitScript — runs before the first byte loads.
// Captures LCP, CLS, and INP using standard PerformanceObserver with buffered:true
// so entries that fired before the observer was registered are not missed.
const INJECT_SCRIPT = () => {
	(window as any).__webVitals = { LCP: null, CLS: 0, INP: null };

	try {
		new PerformanceObserver((list) => {
			const entries = list.getEntries();
			const last = entries[entries.length - 1];
			if (last) {
				(window as any).__webVitals.LCP = last.startTime;
			}
		}).observe({ type: 'largest-contentful-paint', buffered: true });

		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const shift = entry as any;
				if (!shift.hadRecentInput) {
					(window as any).__webVitals.CLS += shift.value ?? 0;
				}
			}
		}).observe({ type: 'layout-shift', buffered: true });

		new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const evt = entry as any;
				const duration = evt.processingEnd - evt.startTime;
				if ((window as any).__webVitals.INP === null || duration > (window as any).__webVitals.INP) {
					(window as any).__webVitals.INP = duration;
				}
			}
		}).observe({ type: 'event', buffered: true, durationThreshold: 16 } as any);
	} catch {
		// PerformanceObserver not available in this context — no-op
	}
};

export async function createWebVitalsCollector(page: Page): Promise<WebVitalsCollector> {
	await page.addInitScript(INJECT_SCRIPT);

	return {
		async getVitals(): Promise<WebVitals> {
			// Wait for a requestIdleCallback after the final interaction so the browser
			// finishes the paint following the last event, ensuring INP is fully captured.
			await page.evaluate(
				() =>
					new Promise<void>((resolve) => {
						if ('requestIdleCallback' in window) {
							(window as any).requestIdleCallback(() => resolve(), { timeout: 500 });
						} else {
							setTimeout(resolve, 100);
						}
					}),
			);

			const vitals = await page.evaluate<WebVitals>(() => (window as any).__webVitals ?? { LCP: null, CLS: 0, INP: null });

			test.info().annotations.push({
				type: 'web-vitals',
				description: JSON.stringify(vitals),
			});

			return vitals;
		},
	};
}
