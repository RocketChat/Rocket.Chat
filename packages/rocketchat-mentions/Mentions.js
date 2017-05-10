/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import _ from 'underscore';
export default class {
	constructor({pattern, me}) {
		this.pattern = pattern;
		this.me = me;
	}
	set me(m) {
		this._me = m;
	}
	get me() {
		return typeof this._me === 'function' ? this._me() : this._me;
	}
	set pattern(p) {
		this._pattern = p;
	}
	get pattern() {
		return typeof this._pattern === 'function' ? this._pattern() : this._pattern;
	}
	get userMentionRegex() {
		return new RegExp(`@(${ this.pattern })`, 'gm');
	}
	get channelMentionRegex() {
		return new RegExp(`#(${ this.pattern })`, 'gm');
	}
	replaceUsers(str, message, me) {
		return str.replace(this.userMentionRegex, (match, username) => {
			if (['all', 'here'].includes(username)) {
				return `<a class="mention-link mention-link-me mention-link-all background-attention-color">${ match }</a>`;
			}

			if (message.temp == null && _.findWhere(message.mentions, {username}) == null) {
				return match;
			}
			return `<a class="mention-link ${ username === me ? 'mention-link-me background-primary-action-color':'' }" data-username="${ username }">${ match }</a>`;
		});
	}
	replaceChannels(str, message) {
		return str.replace(this.channelMentionRegex, (match, name) => {
			if (message.temp == null && _.findWhere(message.channels, {name}) == null) {
				return match;
			}
			return `<a class="mention-link" data-channel="${ name }">${ match }</a>`;
		});
	}
	getUserMentions(str) {
		return str.match(this.userMentionRegex) || [];
	}
	getChannelMentions(str) {
		return str.match(this.channelMentionRegex) || [];
	}
	parse(message) {
		let msg = (message && message.html) || '';
		if (!msg.trim()) {
			return message;
		}
		msg = this.replaceUsers(msg, message, this.me);
		msg = this.replaceChannels(msg, message, this.me);
		message.html = msg;
		return message;
	}
}
