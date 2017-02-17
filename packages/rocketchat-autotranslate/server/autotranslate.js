class AutoTranslate {
	constructor() {
		this.languages = [];
		this.enabled = RocketChat.settings.get('AutoTranslate_Enabled');
		this.apiKey = RocketChat.settings.get('AutoTranslate_GoogleAPIKey');
		RocketChat.callbacks.add('afterSaveMessage', this.translateMessage.bind(this), RocketChat.callbacks.priority.MEDIUM, 'AutoTranslate');
	}

	tokenize(message) {
		message = this.tokenizeEmojis(message);
		message = this.tokenizeCode(message);
		return message;
	}

	tokenizeEmojis(message) {
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

	tokenizeCode(message) {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		let count = message.tokens.length;

		message.html = message.msg;
		RocketChat.MarkdownCode.handle_codeblocks(message);
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

	deTokenize(message) {
		if (message.tokens && message.tokens.length > 0) {
			for (const {token, text, noHtml} of message.tokens) {
				message.msg = message.msg.replace(token, () => noHtml ? noHtml : text);
			}
		}
		return message.msg;
	}

	translateMessage(message, room) {
		if (this.enabled && this.apiKey && message.msg) {
			Meteor.defer(() => {
				// console.log(RocketChat.models.Subscriptions.getAutoTranslateLanguages());

				const translations = {};
				const targetLanguages = ['pt', 'es'];

				message.html = s.escapeHTML(String(message.msg));
				message = this.tokenize(message);

				let msgs = message.msg.split('\n');
				msgs = msgs.map(msg => encodeURIComponent(msg));
				const query = `q=${msgs.join('&q=')}`;
				targetLanguages.forEach(language => {
					const result = HTTP.get('https://translation.googleapis.com/language/translate/v2', { params: { key: this.apiKey, target: language }, query: query });
					if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
						const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
						translations[language] = this.deTokenize(Object.assign({}, message, { msg: txt }));
					}
				});
				if (!_.isEmpty(translations)) {
					RocketChat.models.Messages.setTranslations(message._id, translations);
				}
			});
		}
		return message;
	}

	getSupportedLanguages(target) {
		if (this.enabled && this.apiKey) {
			let result;
			const params = { key: this.apiKey };
			if (target) {
				params.target = target;
			}
			try {
				result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params: params });
			} catch (e) {
				if (e.response && e.response.statusCode === 400 && e.response.data && e.response.data.error && e.response.data.error.status === 'INVALID_ARGUMENT') {
					delete params.target;
					result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params: params });
				}
			} finally {
				return result && result.data && result.data.data && result.data.data.languages;
			}
		}
	}
}

RocketChat.AutoTranslate = new AutoTranslate;
