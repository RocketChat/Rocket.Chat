import type { Page } from '@playwright/test';

export interface ILongAnimationFrame {
	name: string;
	duration: number;
	startTime: number;
}

export interface ILongAnimationFrameTracker {
	getLongAnimationFrames(): ILongAnimationFrame[];
	reset(): void;
}

export async function createLongAnimationFrameCollector(page: Page): Promise<ILongAnimationFrameTracker> {
	const frames: ILongAnimationFrame[] = [];

	await page.exposeFunction('__captureLoAF', (frame: ILongAnimationFrame) => {
		frames.push(frame);
	});

	await page.addInitScript(() => {
		try {
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) {
					(window as any).__captureLoAF({
						name: entry.name ?? 'unknown',
						duration: entry.duration ?? 0,
						startTime: entry.startTime ?? 0,
					});
				}
			}).observe({ type: 'long-animation-frame', buffered: true });
		} catch {
			// PerformanceObserver or long-animation-frame not supported in this context
		}
	});

	return {
		getLongAnimationFrames: () => [...frames],
		reset: () => {
			frames.length = 0;
		},
	};
}
