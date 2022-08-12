import type { UserStatus } from '@rocket.chat/core-typings';

import { newConnection } from './actions/newConnection';
import { removeConnection } from './actions/removeConnection';
import { removeLostConnections } from './actions/removeLostConnections';
import { setStatus, setConnectionStatus } from './actions/setStatus';
import { updateUserPresence } from './actions/updateUserPresence';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import type { IPresence } from '../../../../server/sdk/types/IPresence';
import type { IBrokerNode } from '../../../../server/sdk/types/IBroker';

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	async onNodeDisconnected({ node }: { node: IBrokerNode }): Promise<void> {
		const affectedUsers = await this.removeLostConnections(node.id);
		return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
	}

	async started(): Promise<void> {
		setTimeout(async () => {
			const affectedUsers = await this.removeLostConnections();
			return affectedUsers.forEach((uid) => this.updateUserPresence(uid));
		}, 100);
	}

	async newConnection(uid: string, session: string): Promise<{ uid: string; connectionId: string } | undefined> {
		const result = await newConnection(uid, session, this.context);
		await updateUserPresence(uid);
		return result;
	}

	async removeConnection(uid: string, session: string): Promise<{ uid: string; session: string }> {
		const result = await removeConnection(uid, session);
		await updateUserPresence(uid);
		return result;
	}

	async removeLostConnections(nodeID?: string): Promise<string[]> {
		return removeLostConnections(nodeID, this.context);
	}

	async setStatus(uid: string, status: UserStatus, statusText?: string): Promise<boolean> {
		return setStatus(uid, status, statusText);
	}

	async setConnectionStatus(uid: string, status: UserStatus, session: string): Promise<boolean> {
		const result = await setConnectionStatus(uid, status, session);
		await updateUserPresence(uid);
		return result;
	}

	async updateUserPresence(uid: string): Promise<void> {
		return updateUserPresence(uid);
	}
}
