import type { IMediaCallRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class MediaCallRead implements IMediaCallRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getById(id: string): Promise<IMediaCall | undefined> {
		return bridgeCall<IMediaCall | undefined>(this.senderFn, 'getMediaCallBridge', 'doGetById', id, 'APP_ID');
	}
}
