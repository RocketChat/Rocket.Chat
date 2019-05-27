import { Meteor } from 'meteor/meteor';

const Base = Meteor.isClient
	? require('../../../models/client/models/_Base').Base
	: require('../../../models/server/models/_Base').Base;

class AssistifySmarti extends Base {
	constructor() {
		super('assistify_smarti');

		if (Meteor.isClient) {
			this._initModel('assistify_smarti');
		}
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort });
	}

	findOneById(_id, options) {
		const query = { _id };
		return this.findOne(query, options);
	}

	findOneByConversationId(convId, options) {
		const query = { conversationId: convId };
		return this.findOne(query, options);
	}

	// REMOVE
	clear() {
		const query = { knowledgeProvider: 'smarti' };
		return this.remove(query);
	}
}
export const assistifySmarti = new AssistifySmarti();
