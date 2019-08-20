import _ from 'underscore';

import { FederationRoomEvents, Rooms } from '../../../../models/server';
import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { Federation } from '../../federation';
import getFederatedRoomData from './helpers/getFederatedRoomData';

async function afterSetReaction(message, { user, reaction }) {
	const room = Rooms.findOneById(message.rid);

	// If there are not federated users on this room, ignore it
	if (!getFederatedRoomData(room).hasFederatedUser) { return; }

	logger.client.debug(`afterSetReaction => message=${ JSON.stringify(_.pick(message, '_id', 'msg'), null, 2) } room=${ JSON.stringify(_.pick(room, '_id'), null, 2) } user=${ JSON.stringify(_.pick(user, 'username'), null, 2) } reaction=${ reaction }`);

	// Create the event
	const event = await FederationRoomEvents.createSetMessageReactionEvent(Federation.domain, room._id, message._id, user.username, reaction);

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return message;
}

callbacks.add('afterSetReaction', (message, extras) => Promise.await(afterSetReaction(message, extras)), callbacks.priority.LOW, 'federation-after-set-reaction');
