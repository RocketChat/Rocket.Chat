import { Collection } from 'mongodb';
import { IUserSession } from '@rocket.chat/core-typings';

import { getCollection, Collections } from '../../mongo';
import { IServiceContext } from '../../../../../server/sdk/types/ServiceClass';

async function getAffectedUsers(model: Collection<IUserSession>, query: object): Promise<string[]> {
	const list = await model.find<{ _id: string }>(query, { projection: { _id: 1 } }).toArray();
	return list.map(({ _id }) => _id);
}

// TODO: Change this to use find and modify
export async function removeLostConnections(nodeID?: string, context?: IServiceContext): Promise<string[]> {
	const UserSession = await getCollection<IUserSession>(Collections.UserSession);

	if (nodeID) {
		const query = {
			'connections.instanceId': nodeID,
		};
		const update = {
			$pull: {
				connections: {
					instanceId: nodeID,
				},
			},
		};
		const affectedUsers = await getAffectedUsers(UserSession, query);

		const { modifiedCount } = await UserSession.updateMany(query, update);

		if (modifiedCount === 0) {
			return [];
		}

		return affectedUsers;
	}

	if (!context) {
		return [];
	}

	const nodes = await context.broker.nodeList();

	const ids = nodes.filter((node) => node.available).map(({ id }) => id);

	const affectedUsers = await getAffectedUsers(UserSession, {
		'connections.instanceId': {
			$exists: true,
			$nin: ids,
		},
	});

	const update = {
		$pull: {
			connections: {
				instanceId: {
					$nin: ids,
				},
			},
		},
	};
	const { modifiedCount } = await UserSession.updateMany({}, update);

	if (modifiedCount === 0) {
		return [];
	}

	return affectedUsers;
}
