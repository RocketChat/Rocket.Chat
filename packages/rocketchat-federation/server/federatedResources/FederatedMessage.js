import FederatedResource from './FederatedResource';
import FederatedRoom from './FederatedRoom';
import FederatedUser from './FederatedUser';

class FederatedMessage extends FederatedResource {
	constructor(localPeerIdentifier, messageOrFederatedMessage) {
		super('message');

		this.localPeerIdentifier = localPeerIdentifier;

		if (messageOrFederatedMessage.resourceName) {
			// If resourceName exists, it means it is a federated resource
			const federatedMessageObject = messageOrFederatedMessage;

			// This is a federated message resource
			const { message } = federatedMessageObject;

			// Make sure room dates are correct
			message.ts = new Date(message.ts);
			message._updatedAt = new Date(message._updatedAt);

			// Set message property
			this.message = message;
		} else {
			// If resourceName does not exist, this is a common resource
			const message = messageOrFederatedMessage;

			// Set the message author
			const author = RocketChat.models.Users.findOneById(message.u._id);
			const federatedAuthor = new FederatedUser(localPeerIdentifier, author);

			message.u = {
				username: federatedAuthor.user.username,
				federation: {
					_id: federatedAuthor.user.federation._id,
				},
			};

			// Set the room
			const room = RocketChat.models.Rooms.findOneById(message.rid);

			// Prepare the federation property
			if (!message.federation) {
				const federation = {
					_id: message._id,
					peer: localPeerIdentifier,
					roomId: room.federation._id,
				};

				// Prepare the user
				message.federation = federation;

				// Update the user
				RocketChat.models.Messages.update(message._id, { $set: { federation } });
			}

			// Set message property
			this.message = message;
		}
	}

	getLocalMessage() {
		this.log('getLocalMessage');

		const { localPeerIdentifier, message } = this;

		const localMessage = Object.assign({}, message);

		// Makre sure `u` is correct
		const federatedAuthor = FederatedUser.loadByFederationId(localPeerIdentifier, message.u.federation._id);

		if (!federatedAuthor) {
			throw new Error('Author does not exist');
		}

		const localAuthor = federatedAuthor.getLocalUser();

		localMessage.u = {
			_id: localAuthor._id,
			username: localAuthor.username,
		};

		// Make sure `rid` is correct
		const federatedRoom = FederatedRoom.loadByFederationId(localPeerIdentifier, message.federation.roomId);

		if (!federatedRoom) {
			throw new Error('Room does not exist');
		}

		const localRoom = federatedRoom.getLocalRoom();

		localMessage.rid = localRoom._id;

		return localMessage;
	}

	create() {
		this.log('create');

		// Get the local message object
		const localMessageObject = this.getLocalMessage();

		// Grab the federation id
		const { federation: { _id: federationId } } = localMessageObject;

		// Check if the message exists
		let localMessage = RocketChat.models.Messages.findOne({ 'federation._id': federationId });

		// Create if needed
		if (!localMessage) {
			delete localMessageObject._id;

			localMessage = localMessageObject;

			const localRoom = { _id: localMessage.rid };

			// Create the message
			const { _id } = RocketChat.sendMessage(localMessage.u, localMessage, localRoom, false, { skipCallbacks: true });

			localMessage._id = _id;
		}

		return localMessage;
	}
}

export default FederatedMessage;
