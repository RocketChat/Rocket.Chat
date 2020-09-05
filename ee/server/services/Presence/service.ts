import { newConnection } from './actions/newConnection';
import { removeConnection } from './actions/removeConnection';
import { removeLostConnections } from './actions/removeLostConnections';
import { setStatus, setConnectionStatus } from './actions/setStatus';
import { updateUserPresence } from './actions/updateUserPresence';
import { ServiceClass } from '../../../../server/sdk/types/ServiceClass';
import { IPresence } from '../../../../server/sdk/types/IPresence';
import { USER_STATUS } from '../../../../definition/UserStatus';

export class Presence extends ServiceClass implements IPresence {
	protected name = 'presence';

	async newConnection(uid: string, session: string): Promise<{uid: string; connectionId: string} | undefined> {
		const result = await newConnection(uid, session, this.context);
		await updateUserPresence(uid);
		return result;
	}

	async removeConnection(uid: string, session: string): Promise<{uid: string; session: string}> {
		const result = await removeConnection(uid, session);
		await updateUserPresence(uid);
		return result;
	}

	async removeLostConnections(nodeID: string): Promise<string[]> {
		return removeLostConnections(nodeID, this.context);
	}

	async setStatus(uid: string, status: USER_STATUS, statusText?: string): Promise<boolean> {
		return setStatus(uid, status, statusText);
	}

	async setConnectionStatus(uid: string, status: USER_STATUS, session: string): Promise<boolean> {
		const result = await setConnectionStatus(uid, status, session);
		await updateUserPresence(uid);
		return result;
	}

	async updateUserPresence(uid: string): Promise<void> {
		return updateUserPresence(uid);
	}
}


// import PromService from 'moleculer-prometheus';

// import { afterAll } from './hooks';
// import actions from './actions';

// const { PROMETHEUS_PORT = 9100 } = process.env;

// export default {
// settings: {
// 	port: PROMETHEUS_PORT,
// 	$noVersionPrefix: true,
// },
// mixins: PROMETHEUS_PORT !== 'false' ? [PromService] : [],
// name: 'presence',
// TODO: implement events
// events: {
// 	async '$node.disconnected'({ node }): Promise<void> {
// 		// this.removeNode(node._id);
// 		const affectedUsers = await this.broker.call('presence.removeLostConnections', { node._id });
// 		return affectedUsers.forEach(({ _id: uid }) => this.broker.call('presence.updateUserPresence', { uid }));
// 	},
// },
// actions,
// methods: {
// 	// async removeNode(nodeID: string): Promise<void> {
// 	// 	const affectedUsers = await this.broker.call('presence.removeLostConnections', { nodeID });
// 	// 	return affectedUsers.forEach(({ _id: uid }) => this.broker.call('presence.updateUserPresence', { uid }));
// 	// },
// 	afterAll,
// },
// TODO: check
// async started(): Promise<void> {
// 	setTimeout(async () => {
// 		const affectedUsers = await this.broker.call('presence.removeLostConnections');
// 		return affectedUsers.forEach(({ _id: uid }) => this.broker.call('presence.updateUserPresence', { uid }));
// 	}, 100);
// },
// };
