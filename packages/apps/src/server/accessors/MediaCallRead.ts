import type { IMediaCallRead } from '@rocket.chat/apps-engine/definition/accessors';
import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls';

import type { MediaCallBridge } from '../bridges';

export class MediaCallRead implements IMediaCallRead {
	constructor(
		private mediaCallBridge: MediaCallBridge,
		private appId: string,
	) {}

	public getById(id: string): Promise<IMediaCall | undefined> {
		return this.mediaCallBridge.doGetById(id, this.appId);
	}
}
