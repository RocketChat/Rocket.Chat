import type { Page } from '@playwright/test';

export interface SoftNavMetrics {
	navigationId: string;
	url: string;
	startTime: number;
	duration: number;
	softLCP: number | null;
	CLS: number;
	INP: number | null;
}

export interface SoftNavTracker {
	getNavigations(): Promise<SoftNavMetrics[]>;
}

// Injected into the page via addInitScript — the Soft Navigation API is experimental
// and requires --enable-experimental-web-platform-features in Chromium launch args.
// Falls back gracefully (no-op + console warning) on non-supporting builds.
const INJECT_SCRIPT = () => {
	(window as any).__softNavs = [] as any[];
	(window as any).__currentSoftNav = null as any;

	try {
		if (!('PerformanceObserver' in window)) return;

		// Track soft-navigation entries
		const softNavObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const nav = entry as any;
				const record = {
					navigationId: nav.navigationId ?? nav.id,
					url: nav.name,
					startTime: nav.startTime,
					duration: nav.duration,
					interactionId: nav.interactionId,
					softLCP: null as number | null,
					CLS: 0,
					INP: null as number | null,
				};
				(window as any).__softNavs.push(record);
				(window as any).__currentSoftNav = record;
			}
		});

		softNavObserver.observe({ type: 'soft-navigation', buffered: true } as any);

		// Map interaction-contentful-paint to "Soft LCP" only when its interactionId
		// matches the interactionId of the triggering soft-navigation entry.
		// This prevents non-navigational interactions from being logged as route LCP.
		const icpObserver = new PerformanceObserver((list) => {
			for (const entry of list.getEntries()) {
				const icp = entry as any;
				const matchingNav = ((window as any).__softNavs as any[]).find(
					(nav: any) => nav.interactionId && nav.interactionId === icp.interactionId,
				);
				if (matchingNav) {
					matchingNav.softLCP = icp.startTime;
				}
			}
		});

		icpObserver.observe({ type: 'interaction-contentful-paint', buffered: true } as any);

		// Accumulate CLS and INP per active soft navigation
		const clsObserver = new PerformanceObserver((list) => {
			const current = (window as any).__currentSoftNav;
			if (!current) return;
			for (const entry of list.getEntries()) {
				const shift = entry as any;
				if (!shift.hadRecentInput) {
					current.CLS += shift.value ?? 0;
				}
			}
		});
		clsObserver.observe({ type: 'layout-shift', buffered: false });

		const inpObserver = new PerformanceObserver((list) => {
			const current = (window as any).__currentSoftNav;
			if (!current) return;
			for (const entry of list.getEntries()) {
				const evt = entry as any;
				const duration = evt.processingEnd - evt.startTime;
				if (current.INP === null || duration > current.INP) {
					current.INP = duration;
				}
			}
		});
		inpObserver.observe({ type: 'event', buffered: false, durationThreshold: 16 } as any);
	} catch {
		console.warn('[perf] Soft Navigation API not available — soft-navigation tracking disabled');
	}
};

export async function createSoftNavTracker(page: Page): Promise<SoftNavTracker> {
	await page.addInitScript(INJECT_SCRIPT);

	return {
		async getNavigations(): Promise<SoftNavMetrics[]> {
			return page.evaluate<SoftNavMetrics[]>(() => (window as any).__softNavs ?? []);
		},
	};
}
