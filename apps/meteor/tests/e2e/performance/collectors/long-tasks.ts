import type { CDPSession } from '@playwright/test';

export interface ILongTask {
	name: string;
	duration: number;
	startTime: number;
	navigationId: string | undefined;
}

export interface ILongTaskTracker {
	getLongTasks(): ILongTask[];
	reset(): void;
}

export async function startLongTaskTracking(session: CDPSession): Promise<ILongTaskTracker> {
	const tasks: ILongTask[] = [];

	await session.send('PerformanceTimeline.enable', { eventTypes: ['longtask'] });

	// Attribute each task to its navigationId where available, allowing callers to
	// distinguish initial page hydration tasks from SPA route-change tasks.
	session.on('PerformanceTimeline.timelineEventAdded', (event: any) => {
		const entry = event.event;
		if (entry?.type === 'longtask' || entry?.entryType === 'longtask') {
			tasks.push({
				name: entry.name ?? 'unknown',
				duration: entry.duration ?? 0,
				startTime: entry.startTime ?? entry.time ?? 0,
				navigationId: entry.navigationId,
			});
		}
	});

	return {
		getLongTasks: () => [...tasks],
		reset: () => {
			tasks.length = 0;
		},
	};
}
