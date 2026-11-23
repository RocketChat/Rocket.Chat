import type { ISetting } from '@rocket.chat/apps-engine/definition/settings/index.js';

import type { IInternalBridge } from '../../../src/server/bridges/index.js';

export class TestsInternalBridge implements IInternalBridge {
	public doGetUsernamesOfRoomByIdSync(roomId: string): Array<string> {
		throw new Error('Method not implemented.');
	}

	public doGetUsernamesOfRoomById(roomId: string): Promise<Array<string>> {
		throw new Error('Method not implemented.');
	}

	public doGetWorkspacePublicKey(): Promise<ISetting> {
		throw new Error('Method not implemented.');
	}
}
