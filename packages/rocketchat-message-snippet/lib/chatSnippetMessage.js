class ChatSnippetMessage extends ChatMessages {

	init(node) {
		super.init(node);
		this.numberLineMax = RocketChat.settings.get('MultilinePaste_NumberLineMax');
		this.numberLineAutoDetected = RocketChat.settings.get('MultilinePaste_NumberLineAutoDetected');
		this.rocketCatUser = RocketChat.models.Users.findOne({_id: 'rocket.cat'});
	}

	isSnippet(inputValue) {
		let regexpString = '.*';
		for (var i = 0; i < this.numberLineAutoDetected; i++) {
			regexpString += '\n.*';
		}

		let regexp = new RegExp(regexpString);
		for (let j = this.numberLineAutoDetected; j < this.numberLineMax; j++) {
			regexpString += '\n.*';
		}
		let maxLineRegexp = new RegExp(regexpString);

		// multiline checking
		return ((regexp.exec(inputValue) !== null) && !(maxLineRegexp.exec(inputValue)));
	}

	/**
	 * Create the rocket cat message asking to create the snippet
	 */
	createSnippetNotification(roomId) {
		var createSnippetMsg = {
			_id: Random.id(),
			t: 'snippet-message',
			rid: roomId,
			ts: new Date,
			u: this.rocketCatUser,
			private: true
		};
		ChatMessage.upsert({ _id: createSnippetMsg._id }, createSnippetMsg);
	}

	send(rid, input, done) {
		super.send(rid, input, done);
		if (this.isSnippet(input.value)) {
			this.createSnippetNotification(rid);
		}
	}
}

this.ChatSnippetMessage = ChatSnippetMessage;
