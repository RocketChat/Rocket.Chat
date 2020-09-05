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
// TODO: implement hooks
// hooks: {
// 	after: {
// 		setConnectionStatus: 'afterAll',
// 		newConnection: 'afterAll',
// 		removeConnection: 'afterAll',
// 	},
// },
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
