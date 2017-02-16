function tokenizeEmojis(message) {
	if (!message.tokens || !Array.isArray(message.tokens)) {
		message.tokens = [];
	}
	let count = message.tokens.length;
	message.msg = message.msg.replace(/:\w+:/g, function(match) {
		const token = `<i class=notranslate>{${count++}}</i>`;
		message.tokens.push({
			token: token,
			text: match
		});
		return token;
	});

	return message;
}

function tokenizeInlineCode(message) {
	if (!message.tokens || !Array.isArray(message.tokens)) {
		message.tokens = [];
	}
	let count = message.tokens.length;

	message.html = message.msg;
	RocketChat.MarkdownCode.handle_inlinecode(message);
	message.msg = message.html;

	for (const tokenIndex in message.tokens) {
		if (message.tokens.hasOwnProperty(tokenIndex)) {
			const token = message.tokens[tokenIndex].token;
			if (token.indexOf('notranslate') === -1) {
				const newToken = `<i class=notranslate>{${count++}}</i>`;
				message.msg = message.msg.replace(token, newToken);
				message.tokens[tokenIndex].token = newToken;
			}
		}
	}

	return message;
}

function tokenizeCodeBlock(message) {
	if (!message.tokens || !Array.isArray(message.tokens)) {
		message.tokens = [];
	}
	let count = message.tokens.length;

	message.html = message.msg;
	RocketChat.MarkdownCode.handle_codeblocks(message);
	message.msg = message.html;

	for (const tokenIndex in message.tokens) {
		if (message.tokens.hasOwnProperty(tokenIndex)) {
			const token = message.tokens[tokenIndex].token;
			if (token.indexOf('notranslate') === -1) {
				const newToken = `<i class=notranslate>{${count++}}</i>`;
				message.msg = message.msg.replace(token, newToken);
				message.tokens[tokenIndex].token = newToken;
			}
		}
	}

	return message;
}

function tokenize(message) {
	message = tokenizeEmojis(message);
	message = tokenizeInlineCode(message);
	message = tokenizeCodeBlock(message);
	return message;
}

function deTokenize(message) {
	if (message.tokens && message.tokens.length > 0) {
		for (const {token, text, noHtml} of message.tokens) {
			message.msg = message.msg.replace(token, () => noHtml ? noHtml : text);
		}
	}
	return message.msg;
}

RocketChat.callbacks.add('afterSaveMessage', function(message /*, room */) {
	if (RocketChat.settings.get('AutoTranslate_GoogleAPIKey') && message.msg) {
		Meteor.defer(function() {
			const translations = {};
			const targetLanguages = ['pt', 'es'];

			message.html = s.escapeHTML(String(message.msg));
			message = tokenize(message);

			let msgs = message.msg.split('\n');
			msgs = msgs.map(msg => encodeURIComponent(msg));
			const query = `q=${msgs.join('&q=')}`;
			targetLanguages.forEach(language => {
				const result = HTTP.get('https://translation.googleapis.com/language/translate/v2', { params: { key: RocketChat.settings.get('AutoTranslate_GoogleAPIKey'), target: language }, query: query });
				if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
					const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
					translations[language] = deTokenize(Object.assign({}, message, { msg: txt }));
				}
			});
			if (!_.isEmpty(translations)) {
				RocketChat.models.Messages.setTranslations(message._id, translations);
			}
		});
	}
	return message;
}, RocketChat.callbacks.priority.MEDIUM, 'AutoTranslate');
