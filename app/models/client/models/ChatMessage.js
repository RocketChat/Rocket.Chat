import { Mongo } from 'meteor/mongo';
import { PersistentMinimongo2 } from 'meteor/frozeman:persistent-minimongo2';

export const ChatMessage = new Mongo.Collection(null);

ChatMessage.setReactions = function(messageId, reactions, tempActions) {
	const messageObject = { temp: true, tempActions, reactions };
	return this.update({ _id: messageId }, { $set: messageObject });
};

ChatMessage.unsetReactions = function(messageId) {
	return this.update({ _id: messageId }, { $unset: { reactions: 1 } });
};

new PersistentMinimongo2(ChatMessage, 'Message');
