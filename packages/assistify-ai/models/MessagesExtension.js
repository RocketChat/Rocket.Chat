import { RocketChat } from 'meteor/rocketchat:lib';

Object.assign(RocketChat.models.Messages, {
	setRecognizedTermsById(id, recognizedTerms) {
		return this.update({ _id: id }, { $set: { recognizedTerms } });
	},
});
