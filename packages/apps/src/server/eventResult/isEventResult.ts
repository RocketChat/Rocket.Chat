import { EVENT_RESULT_KIND } from '@rocket.chat/apps-engine/definition/eventResult';
import type { MarkedEventResult } from '@rocket.chat/apps-engine/definition/eventResult';

/**
 * Runtime guard for the `EventResult` marker. Must run *before* any legacy
 * `typeof result === 'object'` / truthiness branch at a consumption site
 *
 * The guard is host-side: an app produces a marked result with the
 * `EventResult.*` factories and never has to recognize one.
 */
export function isEventResult(value: unknown): value is MarkedEventResult {
	return typeof value === 'object' && value !== null && value['@kind'] === EVENT_RESULT_KIND;
}
