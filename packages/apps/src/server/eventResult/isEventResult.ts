import { EVENT_RESULT_KIND } from '@rocket.chat/apps-engine/definition/eventResult';
import type { MarkedEventResult } from '@rocket.chat/apps-engine/definition/eventResult';

/**
 * Runtime guard for the `EventResult` marker.
 */
export function isEventResult(value: unknown): value is MarkedEventResult {
	return typeof value === 'object' && value !== null && value['@kind'] === EVENT_RESULT_KIND;
}
