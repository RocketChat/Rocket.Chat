import { RocketChat } from 'meteor/rocketchat:lib';

Object.assign(RocketChat.models.Messages, {
	setRecognizedTokensById(id, recognizedTokens) {
		return this.update({ _id: id }, { $set: { recognizedTokens } });
	},
});
