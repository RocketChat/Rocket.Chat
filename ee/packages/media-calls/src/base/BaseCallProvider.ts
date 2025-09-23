import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignalBody } from '@rocket.chat/media-signaling';

import { logger } from '../logger';

export class BaseCallProvider {
	public get callId(): string {
		return this.call._id;
	}

	constructor(public readonly call: IMediaCall) {}

	public async reactToCallChanges(params: { dtmf?: ClientMediaSignalBody<'dtmf'> }): Promise<void> {
		logger.debug({ msg: 'BaseCallProvider.reactToCallChanges', callId: this.callId, params });
	}
}
