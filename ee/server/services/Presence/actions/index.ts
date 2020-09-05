import { newConnection } from './newConnection';
import { removeConnection } from './removeConnection';
import { removeLostConnections } from './removeLostConnections';
import { setStatus, setConnectionStatus } from './setStatus';
import { updateUserPresence } from './updateUserPresence';
import { ServiceClass } from '../../../../../server/sdk/types/ServiceClass';
import { IPresence } from '../../../../../server/sdk/types/IPresence';
import { USER_STATUS } from '../../../../../definition/UserStatus';

export default {
	newConnection,
	removeConnection,
	removeLostConnections,
	setStatus,
	setConnectionStatus,
	updateUserPresence,
};

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	async newConnection(uid: string, session: object): Promise<any> {
		return newConnection(uid, session, this.context);
	}

	async removeConnection(uid: string, session: object): Promise<any> {
		return removeConnection(uid, session);
	}

	async removeLostConnections(nodeID: string): Promise<string[]> {
		return removeLostConnections(nodeID, this.context);
	}

	async setStatus(uid: string, status: USER_STATUS, statusText?: string): Promise<boolean> {
		return setStatus(uid, status, statusText);
	}

	async setConnectionStatus(uid: string, status: USER_STATUS, session: string): Promise<boolean> {
		return setConnectionStatus(uid, status, session);
	}

	async updateUserPresence(uid: string): Promise<void> {
		return updateUserPresence(uid);
	}
}
