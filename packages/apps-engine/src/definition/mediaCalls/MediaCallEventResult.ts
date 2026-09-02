import type { MediaCallCreatePatch } from './IPreMediaCallCreatedContext';
import type { MarkedEventResult } from '../eventResult';

/**
 * The `EventResult` variants the pre-media-call-create event permits — see the
 * per-event capability matrix in
 * docs/adr/0002-unified-event-result-for-pre-events.md.
 */
export type MediaCallCreateEventResult = MarkedEventResult<MediaCallCreatePatch>;
