import type { MediaCallCreatePatch } from './IPreMediaCallCreatedContext';
import type { PassEventResult, PatchEventResult, PreventEventResult } from '../eventResult';

export type MediaCallCreateEventResult = PassEventResult | PreventEventResult | PatchEventResult<MediaCallCreatePatch>;
