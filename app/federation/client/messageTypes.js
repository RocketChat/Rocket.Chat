import { MessageTypes } from '../../ui-utils/client';

// Register message types
MessageTypes.registerType({
	id: 'rejected-message-by-peer',
	system: true,
	message: 'This_message_was_rejected_by__peer__peer',
	data(message) {
		return {
			peer: message.peer,
		};
	},
});
MessageTypes.registerType({
	id: 'peer-does-not-exist',
	system: true,
	message: 'The_peer__peer__does_not_exist',
	data(message) {
		return {
			peer: message.peer,
		};
	},
});
MessageTypes.registerType({
	id: 'peer-inactive',
	system: true,
	message: 'The_peer__peer__is_not_active_and_some_users_are_not_receiving_the_messages',
	data(message) {
		return {
			peer: message.peer,
		};
	},
});
