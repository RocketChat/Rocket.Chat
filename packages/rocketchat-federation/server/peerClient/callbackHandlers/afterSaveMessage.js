import { getRoomUsers } from '../../utils';

export default function afterSaveMessageCallbackHandler(message, room) {
	// Ignore messages that are not local or already sent
	if (message.peer) {
		return;
	}

	const { peer: sourcePeer } = this;

	const {
		u: { username: sourceUsername },
	} = message;

	// Get all room users
	const users = getRoomUsers(room);

	// Get the sourceUser and the destUser
	const sourceUser = users.filter((user) => user.username === sourceUsername)[0];
	const destUsers = users.filter((user) => user.username !== sourceUsername);

	// Get all peers to send
	const destPeers = destUsers.reduce((acc, userTo) => {
		if (!userTo || !userTo.peer) {
			return acc;
		}

		acc[userTo.peer._id] = true;

		return acc;
	}, {});

	const destPeerIds = Object.keys(destPeers);

	// Set the peer locally as well
	message.peer = sourcePeer;

	// Set the peer on the database
	RocketChat.models.Messages.update(
		{
			_id: message._id,
		},
		{
			$set: {
				peer: sourcePeer,
			},
		},
	);

	// Set the room's peer
	room.peer = sourcePeer;

	// Send message to hub
	try {
		this.request('POST', '/messages', {
			message,
			source: { peer_id: sourcePeer._id, user_id: sourceUser._id },
			dest: { peer_ids: destPeerIds, room, members: users },
		});

		console.log(`[federation] Sent message to ${ destPeerIds.length } peers`);
	} catch (err) {
		console.log(`[federation] Error sending message to ${ destPeerIds.length } peers`, err);
	}
}
