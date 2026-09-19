import type { MediaCallCreatePatch } from './IPreMediaCallCreatedContext';
import type { PassEventResult, PatchEventResult, PreventEventResult } from '../eventResult';

/**
 * What an `IPreMediaCallCreated` handler returns: let the call through, change
 * it, or block it.
 */
export type MediaCallCreateEventResult = PassEventResult | PreventEventResult | PatchEventResult<MediaCallCreatePatch>;
