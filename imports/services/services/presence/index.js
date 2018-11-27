// import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

import { applyMeteorMixin } from '../../utils';
<<<<<<< HEAD

import {
	newConnection,
	removeConnection,
} from './services';

import {
	afterAll,
} from './hooks';
=======
import { UsersSessions } from '../../../presence/server/model';
>>>>>>> 9849a1486... Initial presence service implementation

export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name: 'presence',
	mixins: [applyMeteorMixin()], // TODO remove
<<<<<<< HEAD
	hooks: {
		after: {
			'*': afterAll,
		},
	},
	actions: {
		newConnection,
		removeConnection,
=======
	// hooks: {
	// 	before: {
	// 		'*': applyMeteor((ctx, res) => {
	// 			console.log('after', res);

	// 			return Promise.resolve(res);
	// 		}),
	// 	},
	// },
	actions: {
		newConnection(ctx) {
			const { userId, connection } = ctx.params;

			const status = 'online';

			const query = {
				_id: userId,
			};

			const now = new Date();

			// const instanceId = InstanceStatus.id();
			const instanceId = ctx.nodeID;

			const update = {
				$push: {
					connections: {
						id: connection.id,
						instanceId,
						status,
						_createdAt: now,
						_updatedAt: now,
					},
				},
			};

			// if (metadata) {
			// 	update.$set = {
			// 		metadata: metadata
			// 	};
			// 	connection.metadata = metadata;
			// }

			// make sure closed connections are being created
			if (!connection.closed) {
				UsersSessions.upsert(query, update);
			}

			return {
				userId,
				connectionId: connection.id,
			};
		},
		removeConnection(ctx) {
			const { connectionId } = ctx.params;

			const query = {
				'connections.id': connectionId,
			};

			const update = {
				$pull: {
					connections: {
						id: connectionId,
					},
				},
			};

			UsersSessions.update(query, update);

			return {
				connectionId,
			};
		},
>>>>>>> 9849a1486... Initial presence service implementation
	},
};
