import type { IExperimentalRead } from '@rocket.chat/apps-engine/definition/accessors';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

// The host ExperimentalRead is an empty placeholder (no public methods); the runtime
// mirror keeps the same shape. The bridges reference is retained for parity with the
// host constructor and for the methods this accessor is expected to grow.
export class ExperimentalRead implements IExperimentalRead {
	constructor(protected readonly bridges: RemoteBridges) {}
}
