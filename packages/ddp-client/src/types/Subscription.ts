import type { ServerPublicationPayloads } from './publicationPayloads';

export interface Subscription {
	stop: () => void;
	ready: () => Promise<void>;
	isReady: boolean;
	onChange: (cb: (arg: ServerPublicationPayloads) => void) => void;
	id: string;
	params: any[];
	name: string;
	error?: unknown;
}
