/* globals Livechat, t, tr, livechatAutolinker */
import moment from 'moment';
import visitor from '../../imports/client/visitor';
import _ from 'underscore';
import s from 'underscore.string';

Template.message.helpers({
	own() {
		if (this.u && this.u._id === visitor.getId()) {
			return 'own';
		}
	},
	time() {
		return moment(this.ts).format('LT');
	},
	date() {
		return moment(this.ts).format('LL');
	},
	isTemp() {
		if (this.temp === true) {
			return 'temp';
		}
	},
	error() {
		if (this.error) {
			return 'msg-error';
		}
	},
	body() {
		switch (this.t) {
			case 'r':
				return t('Room_name_changed', { room_name: this.msg, user_by: this.u.username });
			case 'au':
				return t('User_added_by', { user_added: this.msg, user_by: this.u.username });
			case 'ru':
				return t('User_removed_by', { user_removed: this.msg, user_by: this.u.username });
			case 'ul':
				return tr('User_left', { context: this.u.gender }, { user_left: this.u.username });
			case 'uj':
				return tr('User_joined', { context: this.u.gender }, { user: this.u.username });
			case 'wm':
				return t('Welcome', { user: this.u.username });
			case 'livechat-close':
				return (!_.isEmpty(Livechat.conversationFinishedMessage)) ? Livechat.conversationFinishedMessage : t('Conversation_finished');
			//  case 'rtc': return RocketChat.callbacks.run('renderRtcMessage', this);
			default:
				this.html = this.msg;
				if (s.trim(this.html) !== '') {
					this.html = s.escapeHTML(this.html);
				}
				// message = RocketChat.callbacks.run 'renderMessage', this
				const message = this;
				this.html = message.html.replace(/\n/gm, '<br/>');
				return livechatAutolinker.link(this.html);
		}
	},

	system() {
		if (['s', 'p', 'f', 'r', 'au', 'ru', 'ul', 'wm', 'uj', 'livechat-close'].includes(this.t)) {
			return 'system';
		}
	},

	sender() {
		const agent = Livechat.agent;
		if (agent && this.u.username === agent.username) {
			return agent.name || agent.username;
		}
		return this.u.username;
	}
});

Template.message.onViewRendered = function(context) {
	const view = this;
	this._domrange.onAttached(function(domRange) {
		const lastNode = domRange.lastNode();
		const previousNode = lastNode.previousElementSibling;
		const nextNode = lastNode.nextElementSibling;

		if (!previousNode || previousNode.dataset.date !== lastNode.dataset.date) {
			$(lastNode).addClass('new-day');
			$(lastNode).removeClass('sequential');
		} else if (previousNode.dataset.username !== lastNode.dataset.username) {
			$(lastNode).removeClass('sequential');
		}

		if (nextNode && nextNode.dataset.date === lastNode.dataset.date) {
			$(nextNode).removeClass('new-day');
			$(nextNode).addClass('sequential');
		} else {
			$(nextNode).addClass('new-day');
			$(nextNode).removeClass('sequential');
		}

		if (!nextNode || nextNode.dataset.username !== lastNode.dataset.username) {
			$(nextNode).removeClass('sequential');
		}

		if (context.urls && context.urls.length > 0 && Template.oembedBaseWidget) {
			context.urls.forEach(item => {
				const urlNode = lastNode.querySelector(`.body a[href="${ item.url }"]`);
				if (urlNode) {
					$(urlNode).replaceWith(Blaze.toHTMLWithData(Template.oembedBaseWidget, item));
				}
			});
		}

		if (!nextNode) {
			if (lastNode.classList.contains('own')) {
				view.parentView.parentView.parentView.parentView.parentView.templateInstance().atBottom = true;
			} else if (view.parentView.parentView.parentView.parentView.parentView.templateInstance().atBottom !== true) {
				const newMessage = document.querySelector('.new-message');
				newMessage.className = 'new-message';
			}
		}
	});
};
