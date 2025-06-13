import type { EventBase } from '../core/events/eventBase';

export const makeGetMissingEventsProcedure = (
	getDeepEarliestAndLatestEvents: (
		roomId: string,
		earliest_events: string[],
		latest_events: string[],
	) => Promise<number[]>,
	getMissingEventsByDeep: (
		roomId: string,
		minDepth: number,
		maxDepth: number,
		limit: number,
	) => Promise<EventBase[]>,
) => {
	return async (
		roomId: string,
		earliest_events: string[],
		latest_events: string[],
		limit: number,
	) => {
		const [minDepth, maxDepth] = await getDeepEarliestAndLatestEvents(
			roomId,
			earliest_events,
			latest_events,
		);

		const events = await getMissingEventsByDeep(
			roomId,
			minDepth,
			maxDepth,
			limit,
		);

		return {
			events,
		};
	};
};
