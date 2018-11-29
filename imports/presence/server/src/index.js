import { afterAll } from './hooks';
import actions from './actions';

export default ({ UserSession, User }) => ({
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'presence',
	mixins: [],
	hooks: {
		after: {
			setConnectionStatus: 'afterAll',
			setStatus:'afterAll',
			newConnection: 'afterAll',
			removeConnection: 'afterAll',
		},
	},
	events: {
		async '$node.disconnected'({ node }) {
			const { affectedUsers } = await this.broker.call('presence.removeLostConnections', { nodeID: node.id });

			return affectedUsers.map((uid) => this.afterAll({ params: { uid } })); // TODO wtf?
		},
	},
	actions,
	methods:{
		afterAll,
		userSession() { return UserSession ; },
		user() { return User ; },
	},
});
