import type { IThreadRead } from '@rocket.chat/apps-engine/definition/accessors/IThreadRead';
import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class ThreadRead implements IThreadRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getThreadById(id: string): Promise<Array<IMessage>> {
		return this.bridges.getThreadBridge().doGetById(id, 'APP_ID') as Promise<Array<IMessage>>;
	}
}
