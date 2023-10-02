/*
 * Mentions is a named function that will process Mentions
 * @param {Object} message - The message object
 */
import { MentionsParser } from '../lib/MentionsParser';

export default class MentionsServer extends MentionsParser {
	constructor(args) {
		super(args);
		this.messageMaxAll = args.messageMaxAll;
		this.getChannel = args.getChannel;
		this.getChannels = args.getChannels;
		this.getUsers = args.getUsers;
		this.getUser = args.getUser;
		this.getTotalChannelMembers = args.getTotalChannelMembers;
		this.onMaxRoomMembersExceeded = args.onMaxRoomMembersExceeded || (() => {});
	}

	set getUsers(m) {
		this._getUsers = m;
	}

	get getUsers() {
		return typeof this._getUsers === 'function' ? this._getUsers : async () => this._getUsers;
	}

	set getChannels(m) {
		this._getChannels = m;
	}

	get getChannels() {
		return typeof this._getChannels === 'function' ? this._getChannels : () => this._getChannels;
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

	async getUsersByMentions({ msg, rid, u: sender }) {
		let mentions = this.getUserMentions(msg);
		const mentionsAll = [];
		const userMentions = [];

		for await (const m of mentions) {
			const mention = m.trim().substr(1);
			if (mention !== 'all' && mention !== 'here') {
				userMentions.push(mention);
				continue;
			}
			if (this.messageMaxAll > 0 && (await this.getTotalChannelMembers(rid)) > this.messageMaxAll) {
				await this.onMaxRoomMembersExceeded({ sender, rid });
				continue;
			}
			mentionsAll.push({
				_id: mention,
				username: mention,
			});
		}
		mentions = userMentions.length ? await this.getUsers(userMentions) : [];
		return [...mentionsAll, ...mentions];
	}

	async getChannelbyMentions({ msg }) {
		const channels = this.getChannelMentions(msg);
		return this.getChannels(channels.map((c) => c.trim().substr(1)));
	}

	async execute(message) {
		const mentionsAll = await this.getUsersByMentions(message);
		const channels = await this.getChannelbyMentions(message);

		message.mentions = mentionsAll;
		message.channels = channels;

		return message;
	}
}
