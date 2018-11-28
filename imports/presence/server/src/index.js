// import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';
import { afterAll } from './hooks';
import actions from './actions';

export default ({ UserSession, User }) => ({
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'presence',
	mixins: [], // TODO remove
	hooks: {
		after: {
			newConnection: 'afterAll',
			removeConnection: 'afterAll',
		},
	},
	events: {
		'$node.disconnected'() {
			return this.broker.call('presence.removeLostConnections');
		},
	},
	actions,
	methods:{
		afterAll,
		userSession() { return UserSession ; },
		user() { return User ; },
	},
});
