/* globals renderEmoji renderMessageBody */

import moment from 'moment';

Template.messagePreview.helpers({
	encodeURI(text) {
		return encodeURI(text);
	},
	isBot() {
		if (this.bot != null) {
			return 'bot';
		}
	},
	avatarFromUsername() {
		if ((this.avatar != null) && this.avatar[0] === '@') {
			return this.avatar.replace(/^@/, '');
		}
	},
	getEmoji(emoji) {
		return renderEmoji(emoji);
	},
	getName() {
		if (this.alias) {
			return this.alias;
		}
		if (!this.u) {
			return '';
		}
		return (RocketChat.settings.get('UI_Use_Real_Name') && this.u.name) || this.u.username;
	},
	showUsername() {
		return this.alias || RocketChat.settings.get('UI_Use_Real_Name') && this.u && this.u.name;
	},
	own() {
		if (this.u && this.u._id === Meteor.userId()) {
			return 'own';
		}
	},
	timestamp() {
		return +this.ts;
	},
	chatops() {
		if (this.u && this.u.username === RocketChat.settings.get('Chatops_Username')) {
			return 'chatops-message';
		}
	},
	time() {
		return moment(this.ts).format(RocketChat.settings.get('Message_TimeFormat'));
	},
	date() {
		return moment(this.ts).format(RocketChat.settings.get('Message_DateFormat'));
	},
	isTemp() {
		if (this.temp === true) {
			return 'temp';
		}
	},
	body() {
		return Template.instance().body;
	},
	system(returnClass) {
		if (RocketChat.MessageTypes.isSystemMessage(this)) {
			if (returnClass) {
				return 'color-info-font-color';
			}
			return 'system';
		}
	},
	showTranslated() {
		if (RocketChat.settings.get('AutoTranslate_Enabled') && this.u && this.u._id !== Meteor.userId() && !RocketChat.MessageTypes.isSystemMessage(this)) {
			const subscription = RocketChat.models.Subscriptions.findOne({
				rid: this.rid,
				'u._id': Meteor.userId()
			}, {
				fields: {
					autoTranslate: 1,
					autoTranslateLanguage: 1
				}
			});
			const language = RocketChat.AutoTranslate.getLanguage(this.rid);
			return this.autoTranslateFetching || subscription && subscription.autoTranslate !== this.autoTranslateShowInverse && this.translations && this.translations[language];
		}
	},
	label() {
		if (this.i18nLabel) {
			return t(this.i18nLabel);
		} else if (this.label) {
			return this.label;
		}
	},
	hasOembed() {
		if (!(this.urls && this.urls.length > 0) || !Template.oembedBaseWidget || !RocketChat.settings.get('API_Embed')) {
			return false;
		}

		if ((RocketChat.settings.get('API_EmbedDisabledFor')||'').split(',').map(username => username.trim()).includes(this.u && this.u.username)) {
			return false;
		}
		return true;
	},
	injectIndex(data, index) {
		data.index = index;
	}
});

Template.messagePreview.onCreated(function() {
	let msg = Template.currentData();

	return this.body = (() => {
		const isSystemMessage = RocketChat.MessageTypes.isSystemMessage(msg);
		const messageType = RocketChat.MessageTypes.getType(msg)||{};
		if (messageType.render) {
			msg = messageType.render(msg);
		} else if (messageType.message) {
			if (typeof messageType.data === 'function' && messageType.data(msg)) {
				msg = TAPi18n.__(messageType.message, messageType.data(msg));
			} else {
				msg = TAPi18n.__(messageType.message);
			}
		} else if (msg.u && msg.u.username === RocketChat.settings.get('Chatops_Username')) {
			msg.html = msg.msg;
			msg = RocketChat.callbacks.run('renderMentions', msg);
			msg = msg.html;
		} else {
			msg = renderMessageBody(msg);
		}

		if (isSystemMessage) {
			msg.html = RocketChat.Markdown.parse(msg.html);
		}
		return msg;
	})();
});
