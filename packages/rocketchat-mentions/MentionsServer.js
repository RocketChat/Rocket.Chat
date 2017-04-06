/*
* Mentions is a named function that will process Mentions
* @param {Object} message - The message object
*/
import Mentions from './Mentions';
export default class MentionsServer extends Mentions {
	constructor(args) {
		super(args);
		this.messageMaxAll = args.messageMaxAll;
		this.getChannel = args.getChannel;
		this.getUsers = args.getUsers;
	}
	getChannels(channels) {
		return RocketChat.models.Rooms.find({ name: {$in: _.unique(channels)}, t: 'c'	}, { fields: {_id: 1, name: 1 }}).fetch();
	}
	set getUsers(m) {
		this._getUsers = m;
	}
	get getUsers() {
		return typeof this._getUsers === 'function' ? this._getUsers : () => this._getUsers;
	}
	set getChannel(m) {
		this._getChannel = m;
	}
	get getChannel() {
		return typeof this._getChannel === 'function' ? this._getChannel : () => this._getChannel;
	}
	set messageMaxAll(m) {
		this._messageMaxAll = m;
	}
	get messageMaxAll() {
		return typeof this._messageMaxAll === 'function' ? this._messageMaxAll() : this._messageMaxAll;
	}
	getUsersByMentions({msg, rid}) {
		let mentions = this.getUserMentions(msg);
		const mentionsAll = [];
		const userMentions = [];

		mentions.forEach((m) => {
			const mention = m.trim().substr(1);
			if (mention !== 'all' && mention !== 'here') {
				return userMentions.push(mention);
			}
			if (mention === 'all') {
				const messageMaxAll = this.messageMaxAll;
				const allChannel = this.getChannel(rid);
				if (messageMaxAll !== 0 && allChannel.usernames.length >= messageMaxAll) {
					return;
				}
			}
			mentionsAll.push({
				_id: mention,
				username: mention
			});
		});
		mentions = userMentions.length ? this.getUsers(userMentions) : [];

		return [...mentionsAll, ...mentions];
	}
	getChannelbyMentions(message) {
		let channels = message.msg.match(this.channelMentionRegex);
		if (channels) {
			channels = channels.map(c => c.trim().substr(1));
			return this.getChannels(channels);
		}
	}
	execute(message) {
		const mentionsAll = this.getUsersByMentions(message);
		const channels = this.getChannelbyMentions(message);
		if (mentionsAll.length !== 0) {
			message.mentions = mentionsAll;
		}
		if (channels.length !== 0) {
			message.channels = channels;
		}
		return message;
	}
}
