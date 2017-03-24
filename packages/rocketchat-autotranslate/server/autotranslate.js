class AutoTranslate {
	constructor() {
		this.languages = [];
		this.enabled = RocketChat.settings.get('AutoTranslate_Enabled');
		this.apiKey = RocketChat.settings.get('AutoTranslate_GoogleAPIKey');
		this.supportedLanguages = {};
		RocketChat.callbacks.add('afterSaveMessage', this.translateMessage.bind(this), RocketChat.callbacks.priority.MEDIUM, 'AutoTranslate');

		RocketChat.settings.get('AutoTranslate_Enabled', (key, value) => {
			this.enabled = value;
		});
		RocketChat.settings.get('AutoTranslate_GoogleAPIKey', (key, value) => {
			this.apiKey = value;
		});
	}

	tokenize(message) {
		message = this.tokenizeEmojis(message);
		message = this.tokenizeCode(message);
		message = this.tokenizeURLs(message);
		message = this.tokenizeMentions(message);
		return message;
	}

	tokenizeEmojis(message) {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		let count = message.tokens.length;
		message.msg = message.msg.replace(/:[+\w\d]+:/g, function(match) {
			const token = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token,
				text: match
			});
			return token;
		});

		return message;
	}

	tokenizeURLs(message) {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		let count = message.tokens.length;

		const schemes = RocketChat.settings.get('Markdown_SupportSchemesForLink').split(',').join('|');

		// Support ![alt text](http://image url) and [text](http://link)
		message.msg = message.msg.replace(new RegExp(`(!?\\[)([^\\]]+)(\\]\\((?:${ schemes }):\\/\\/[^\\)]+\\))`, 'gm'), function(match, pre, text, post) {
			const pretoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: pretoken,
				text: pre
			});

			const posttoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: posttoken,
				text: post
			});

			return pretoken + text + posttoken;
		});

		// Support <http://link|Text>
		message.msg = message.msg.replace(new RegExp(`((?:<|&lt;)(?:${ schemes }):\\/\\/[^\\|]+\\|)(.+?)(?=>|&gt;)((?:>|&gt;))`, 'gm'), function(match, pre, text, post) {
			const pretoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: pretoken,
				text: pre
			});

			const posttoken = `<i class=notranslate>{${ count++ }}</i>`;
			message.tokens.push({
				token: posttoken,
				text: post
			});

			return pretoken + text + posttoken;
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
					const newToken = `<i class=notranslate>{${ count++ }}</i>`;
					message.msg = message.msg.replace(token, newToken);
					message.tokens[tokenIndex].token = newToken;
				}
			}
		}

		return message;
	}

	tokenizeMentions(message) {
		if (!message.tokens || !Array.isArray(message.tokens)) {
			message.tokens = [];
		}
		let count = message.tokens.length;

		if (message.mentions && message.mentions.length > 0) {
			message.mentions.forEach(mention => {
				message.msg = message.msg.replace(new RegExp(`(@${ mention.username })`, 'gm'), match => {
					const token = `<i class=notranslate>{${ count++ }}</i>`;
					message.tokens.push({
						token,
						text: match
					});
					return token;
				});
			});
		}

		if (message.channels && message.channels.length > 0) {
			message.channels.forEach(channel => {
				message.msg = message.msg.replace(new RegExp(`(#${ channel.name })`, 'gm'), match => {
					const token = `<i class=notranslate>{${ count++ }}</i>`;
					message.tokens.push({
						token,
						text: match
					});
					return token;
				});
			});
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

	translateMessage(message, room, targetLanguage) {
		if (this.enabled && this.apiKey) {
			let targetLanguages;
			if (targetLanguage) {
				targetLanguages = [ targetLanguage ];
			} else {
				targetLanguages = RocketChat.models.Subscriptions.getAutoTranslateLanguagesByRoomAndNotUser(room._id, message.u && message.u._id);
			}
			if (message.msg) {
				Meteor.defer(() => {
					const translations = {};
					let targetMessage = Object.assign({}, message);

					targetMessage.html = s.escapeHTML(String(targetMessage.msg));
					targetMessage = this.tokenize(targetMessage);

					let msgs = targetMessage.msg.split('\n');
					msgs = msgs.map(msg => encodeURIComponent(msg));
					const query = `q=${ msgs.join('&q=') }`;

					const supportedLanguages = this.getSupportedLanguages('en');
					targetLanguages.forEach(language => {
						if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
							language = language.substr(0, 2);
						}
						let result;
						try {
							result = HTTP.get('https://translation.googleapis.com/language/translate/v2', { params: { key: this.apiKey, target: language }, query });
						} catch (e) {
							console.log('Error translating message', e);
							return message;
						}
						if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
							const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
							translations[language] = this.deTokenize(Object.assign({}, targetMessage, { msg: txt }));
						}
					});
					if (!_.isEmpty(translations)) {
						RocketChat.models.Messages.addTranslations(message._id, translations);
					}
				});
			}

			if (message.attachments && message.attachments.length > 0) {
				Meteor.defer(() => {
					for (const index in message.attachments) {
						if (message.attachments.hasOwnProperty(index)) {
							const attachment = message.attachments[index];
							const translations = {};
							if (attachment.description || attachment.text) {
								const query = `q=${ encodeURIComponent(attachment.description || attachment.text) }`;
								const supportedLanguages = this.getSupportedLanguages('en');
								targetLanguages.forEach(language => {
									if (language.indexOf('-') !== -1 && !_.findWhere(supportedLanguages, { language })) {
										language = language.substr(0, 2);
									}
									const result = HTTP.get('https://translation.googleapis.com/language/translate/v2', { params: { key: this.apiKey, target: language }, query });
									if (result.statusCode === 200 && result.data && result.data.data && result.data.data.translations && Array.isArray(result.data.data.translations) && result.data.data.translations.length > 0) {
										const txt = result.data.data.translations.map(translation => translation.translatedText).join('\n');
										translations[language] = txt;
									}
								});
								if (!_.isEmpty(translations)) {
									RocketChat.models.Messages.addAttachmentTranslations(message._id, index, translations);
								}
							}
						}
					}
				});
			}
		}
		return message;
	}

	getSupportedLanguages(target) {
		if (this.enabled && this.apiKey) {
			if (this.supportedLanguages[target]) {
				return this.supportedLanguages[target];
			}

			let result;
			const params = { key: this.apiKey };
			if (target) {
				params.target = target;
			}

			try {
				result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params });
			} catch (e) {
				if (e.response && e.response.statusCode === 400 && e.response.data && e.response.data.error && e.response.data.error.status === 'INVALID_ARGUMENT') {
					params.target = 'en';
					target = 'en';
					if (!this.supportedLanguages[target]) {
						result = HTTP.get('https://translation.googleapis.com/language/translate/v2/languages', { params });
					}
				}
			} finally {
				if (this.supportedLanguages[target]) {
					return this.supportedLanguages[target];
				} else {
					this.supportedLanguages[target || 'en'] = result && result.data && result.data.data && result.data.data.languages;
					return this.supportedLanguages[target || 'en'];
				}
			}
		}
	}
}

RocketChat.AutoTranslate = new AutoTranslate;
