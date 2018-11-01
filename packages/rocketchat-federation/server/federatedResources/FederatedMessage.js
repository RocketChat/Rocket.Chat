import FederatedResource from './FederatedResource';
import FederatedRoom from './FederatedRoom';
import FederatedUser from './FederatedUser';

class FederatedMessage extends FederatedResource {
	constructor(localPeerIdentifier, message) {
		super('message');

		if (!message) {
			throw new Error('message param cannot be empty');
		}

		this.localPeerIdentifier = localPeerIdentifier;

		// if (messageOrFederatedMessage.resourceName) {
		// 	// If resourceName exists, it means it is a federated resource
		// 	const federatedMessageObject = messageOrFederatedMessage;

		// 	const { federatedAuthor: federatedAuthorObject } = federatedMessageObject;

		// 	// This is a federated message resource
		// 	const { message } = federatedMessageObject;

		// 	// Make sure room dates are correct
		// 	message.ts = new Date(message.ts);
		// 	message._updatedAt = new Date(message._updatedAt);

		// 	// Load the author
		// 	this.federatedAuthor = new FederatedUser(localPeerIdentifier, federatedAuthorObject);

		// 	// Set message property
		// 	this.message = message;
		// } else {

		// Make sure room dates are correct
		message.ts = new Date(message.ts);
		message._updatedAt = new Date(message._updatedAt);

		// Set the message author
		if (message.u.federation) {
			this.federatedAuthor = FederatedUser.loadByFederationId(localPeerIdentifier, message.u.federation._id);
		} else {
			const author = RocketChat.models.Users.findOneById(message.u._id);
			this.federatedAuthor = new FederatedUser(localPeerIdentifier, author);
		}

		message.u = {
			username: this.federatedAuthor.user.username,
			federation: {
				_id: this.federatedAuthor.user.federation._id,
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

	getFederationId() {
		return this.message.federation._id;
	}

	getMessage() {
		return this.message;
	}

	getLocalMessage() {
		this.log('getLocalMessage');

		const { localPeerIdentifier, message } = this;

		const localMessage = Object.assign({}, message);

		// Make sure `u` is correct
		if (!this.federatedAuthor) {
			throw new Error('Author does not exist');
		}

		const localAuthor = this.federatedAuthor.getLocalUser();

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
			const { _id } = RocketChat.sendMessage(localMessage.u, localMessage, localRoom, false);

			localMessage._id = _id;
		}

		return localMessage;
	}

	update(updatedByFederatedUser) {
		this.log('update');

		// Get the original message
		const originalMessage = RocketChat.models.Messages.findOne({ 'federation._id': this.getFederationId() });

		// Error if message does not exist
		if (!originalMessage) {
			throw new Error('Message does not exist');
		}

		// Get the local message object
		const localMessage = this.getLocalMessage();

		// Make sure the message has the correct _id
		localMessage._id = originalMessage._id;

		// Get the user who updated
		const user = updatedByFederatedUser.getLocalUser();

		// Update the message
		RocketChat.updateMessage(localMessage, user, originalMessage);

		return localMessage;
	}
}

FederatedMessage.loadByFederationId = function loadByFederationId(localPeerIdentifier, federationId) {
	const localMessage = RocketChat.models.Messages.findOne({ 'federation._id': federationId });

	if (!localMessage) { return; }

	return new FederatedMessage(localPeerIdentifier, localMessage);
};

FederatedMessage.loadOrCreate = function loadOrCreate(localPeerIdentifier, message) {
	const { federation } = message;

	if (federation) {
		const federatedMessage = FederatedMessage.loadByFederationId(localPeerIdentifier, federation._id);

		if (federatedMessage) {
			return federatedMessage;
		}
	}

	return new FederatedMessage(localPeerIdentifier, message);
};

export default FederatedMessage;
