import type { ServerPublicationPayloads } from './publicationPayloads';

export interface Subscription {
	stop: () => void;
	ready: () => Promise<void>;
	isReady: boolean;
	onChange: (cb: (arg: ServerPublicationPayloads) => void) => void;
	/** Calls `listener` with the reason when the server stops the subscription; `stop()` doesn't call it. Returns a function that removes the listener. */
	onStop: (listener: (error: unknown) => void) => () => void;
	id: string;
	params: any[];
	name: string;
	error?: unknown;
}
