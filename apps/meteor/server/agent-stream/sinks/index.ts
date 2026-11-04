import { updateMessageSink } from './updateMessageSink';
import type { SinkFactory } from '../producer';

/** The sinks a run can pick by name. */
export const sinks: Record<string, SinkFactory> = {
	'update-message': updateMessageSink,
};
