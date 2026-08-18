import type { IMediaCall } from '@rocket.chat/apps-engine/definition/mediaCalls';

import { MediaCallBridge } from '../../../src/server/bridges';

export class TestsMediaCallBridge extends MediaCallBridge {
	public getById(callId: string, appId: string): Promise<IMediaCall> {
		throw new Error('Method not implemented.');
	}
}
