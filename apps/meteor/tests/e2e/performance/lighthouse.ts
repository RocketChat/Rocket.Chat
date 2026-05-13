import type { Browser, Page } from '@playwright/test';
import { chromium } from '@playwright/test';

export interface ILighthouseResult {
	lhr: {
		categories: Record<string, { score: number | null; title: string }>;
		audits: Record<string, { numericValue?: number; score: number | null; title: string }>;
		fetchTime: string;
		requestedUrl: string;
	};
	report: string;
}

export interface ILighthouseHelper {
	/** Creates a page in the Lighthouse browser for authentication/navigation. */
	newPage(): Promise<Page>;
	/** Runs a Lighthouse audit against `url`. Authenticate via newPage() first. */
	runAudit(url: string, preset?: 'desktop' | 'mobile'): Promise<ILighthouseResult>;
	/** Closes the underlying browser. Called automatically by the fixture teardown. */
	close(): Promise<void>;
}

export async function createLighthouseHelper(port: number): Promise<ILighthouseHelper> {
	// The port is passed both here (so Playwright controls the browser) and to the
	// Lighthouse config (so Lighthouse can connect to the same running instance).
	const browser: Browser = await chromium.launch({
		args: [`--remote-debugging-port=${port}`, '--use-gl=egl', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
	});

	const context = await browser.newContext();

	return {
		newPage: () => context.newPage(),

		async runAudit(url: string, preset: 'desktop' | 'mobile' = 'desktop'): Promise<ILighthouseResult> {
			const { default: lighthouse } = await import('lighthouse');

			// Presets are applied via the config parameter, not flags.
			// Desktop config disables mobile emulation and sets appropriate screen dimensions.
			const config =
				preset === 'desktop'
					? {
							extends: 'lighthouse:default',
							settings: {
								formFactor: 'desktop' as const,
								throttling: {
									rttMs: 40,
									throughputKbps: 10240,
									cpuSlowdownMultiplier: 1,
									requestLatencyMs: 0,
									downloadThroughputKbps: 0,
									uploadThroughputKbps: 0,
								},
								screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
							},
						}
					: undefined;

			const result = await lighthouse(
				url,
				{
					port,
					// Preserve cookies and localStorage set by Playwright so Lighthouse audits
					// the authenticated state instead of a fresh session.
					disableStorageReset: true,
					output: 'json',
					logLevel: 'silent',
				},
				config,
			);

			if (!result) {
				throw new Error('Lighthouse returned no result');
			}

			return result as unknown as ILighthouseResult;
		},

		close: () => browser.close(),
	};
}
