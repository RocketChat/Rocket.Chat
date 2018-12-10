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

			// Prepare mentions
			for (const mention of message.mentions) {

				mention.federation = mention.federation || {};

				if (mention.username.indexOf('@') === -1) {
					mention.federation.peer = localPeerIdentifier;
				} else {
					const [username, peer] = mention.username.split('@');

					mention.username = username;
					mention.federation.peer = peer;
				}
			}

			// Prepare channels
			for (const channel of message.channels) {
				channel.federation = channel.federation || {};

				if (channel.name.indexOf('@') === -1) {
					channel.federation.peer = localPeerIdentifier;
				} else {
					channel.name = channel.name.split('@')[0];
					channel.federation.peer = channel.name.split('@')[1];
				}
			}
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

			// Normalize mentions
			for (const mention of localMessage.mentions) {
				let usernameToReplace = '';

				if (mention.federation.peer !== this.localPeerIdentifier) {
					usernameToReplace = mention.username;

					mention.username = `${ mention.username }@${ mention.federation.peer }`;
				} else {
					usernameToReplace = `${ mention.username }@${ mention.federation.peer }`;
				}

				localMessage.msg = localMessage.msg.split(usernameToReplace).join(mention.username);
			}

			// Normalize channels
			for (const channel of localMessage.channels) {
				if (channel.federation.peer !== this.localPeerIdentifier) {
					channel.name = `${ channel.name }@${ channel.federation.peer }`;
				}
			}

			// Is there a file?
			if (localMessage.file) {
				const fileStore = FileUpload.getStore('Uploads');

				const { federation: { peer: identifier } } = localMessage;

				const { upload, buffer } = Meteor.federationPeerClient.getUpload({ identifier, localMessage });

				const oldUploadId = upload._id;

				// Normalize upload
				delete upload._id;
				upload.rid = localMessage.rid;
				upload.userId = localMessage.u._id;
				upload.federation = {
					_id: localMessage.file._id,
					peer: identifier,
				};

				Meteor.runAsUser(upload.userId, () => Meteor.wrapAsync(fileStore.insert.bind(fileStore))(upload, buffer));

				// Update the message's file
				localMessage.file._id = upload._id;

				// Update the message's attachments
				for (const attachment of localMessage.attachments) {
					attachment.title_link = attachment.title_link.replace(oldUploadId, upload._id);
					attachment.image_url = attachment.image_url.replace(oldUploadId, upload._id);
				}
			}

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
