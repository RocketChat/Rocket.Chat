import type { CDPSession, Page } from '@playwright/test';

export interface ICDPMetrics {
	JSHeapUsedSize: number;
	JSHeapTotalSize: number;
	LayoutCount: number;
	RecalcStyleCount: number;
	LayoutDuration: number;
	RecalcStyleDuration: number;
	ScriptDuration: number;
	TaskDuration: number;
	Timestamp: number;
}

export async function openCDPSession(page: Page): Promise<CDPSession> {
	const session = await page.context().newCDPSession(page);
	await session.send('Performance.enable');
	await session.send('Memory.prepareForLeakDetection');
	return session;
}

export async function getMetrics(session: CDPSession): Promise<ICDPMetrics> {
	const result = (await session.send('Performance.getMetrics')) as { metrics: Array<{ name: string; value: number }> };
	const map: Record<string, number> = {};
	for (const { name, value } of result.metrics) {
		map[name] = value;
	}
	return map as unknown as ICDPMetrics;
}

export async function collectGarbage(session: CDPSession): Promise<void> {
	await session.send('HeapProfiler.collectGarbage');
}

// 4× CPU slowdown simulates a mid-range device and stabilises synthetic metrics
// across CI runners with varying load.
export async function setCPUThrottling(session: CDPSession, rate = 4): Promise<void> {
	await session.send('Emulation.setCPUThrottlingRate', { rate });
}

// Fast 3G: 1.5 Mbps down / 750 Kbps up / 40ms RTT
// offline must be explicitly false — some implementations incorrectly default to true
export async function setNetworkThrottling(session: CDPSession): Promise<void> {
	await session.send('Network.emulateNetworkConditions', {
		offline: false,
		downloadThroughput: (1.5 * 1024 * 1024) / 8,
		uploadThroughput: (750 * 1024) / 8,
		latency: 40,
	});
}
