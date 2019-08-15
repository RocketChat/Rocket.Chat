import _ from 'underscore';

import { FederationRoomEvents, Rooms } from '../../../../models/server';
import { callbacks } from '../../../../callbacks';
import { logger } from '../../logger';
import { Federation } from '../../federation';

async function afterUnsetReaction(message, { user, reaction }) {
	const room = Rooms.findOneById(message.rid);

	logger.client.debug(`afterUnsetReaction => message=${ JSON.stringify(_.pick(message, '_id', 'msg'), null, 2) } room=${ JSON.stringify(_.pick(room, '_id'), null, 2) } user=${ JSON.stringify(_.pick(user, 'username'), null, 2) } reaction=${ reaction }`);

	// Currently, only direct rooms
	if (room.t !== 'd') { return; }

	// Check if there is a federated user on this room
	const hasFederatedUser = room.usernames.find((u) => u.indexOf('@') !== -1);

	// If there are not federated users on this room, ignore it
	if (!hasFederatedUser) { return; }

	// Create the event
	const event = await FederationRoomEvents.createUnsetMessageReactionEvent(Federation.domain, room._id, message._id, user.username, reaction);

	// Dispatch event (async)
	Federation.client.dispatchEvent(room.federation.domains, event);

	return message;
}

callbacks.add('afterUnsetReaction', (message, extras) => Promise.await(afterUnsetReaction(message, extras)), callbacks.priority.LOW, 'federation-after-unset-reaction');
