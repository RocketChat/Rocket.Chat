import type { IExperimentalRead } from '@rocket.chat/apps-engine/definition/accessors';

import type * as Messenger from '../../messenger';

// The host ExperimentalRead is an empty placeholder (no public methods); the runtime
// mirror keeps the same shape. The senderFn is retained for parity with the other readers'
// constructors and for the methods this accessor is expected to grow.
export class ExperimentalRead implements IExperimentalRead {
	constructor(protected readonly senderFn: typeof Messenger.sendRequest) {}
}
