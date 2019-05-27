import { Messages } from '../../../../models/server';

Object.assign(Messages, {
	setRecognizedTokensById(id, recognizedTokens) {
		return this.update({ _id: id }, { $set: { recognizedTokens } });
	},
});
