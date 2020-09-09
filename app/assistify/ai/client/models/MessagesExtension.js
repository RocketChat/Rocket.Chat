import { ChatMessages } from '../../../../ui';

Object.assign(ChatMessages, {
	setRecognizedTokensById(id, recognizedTokens) {
		return this.update({ _id: id }, { $set: { recognizedTokens } });
	},
});
