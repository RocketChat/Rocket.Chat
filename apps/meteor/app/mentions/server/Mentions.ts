/*
 * Mentions is a named function that will process Mentions
 * @param {Object} message - The message object
 */
import { isE2EEMessage, type IMessage, type IRoom, type IUser } from '@rocket.chat/core-typings';

import { extractMentionsFromMessageAST } from '../../lib/server/functions/extractMentionsFromMessageAST';
import { type MentionsParserArgs, MentionsParser } from '../lib/MentionsParser';

type MentionsServerArgs = MentionsParserArgs & {
	messageMaxAll: () => number;
	getChannels: (c: string[]) => Promise<Pick<IRoom, '_id' | 'name' | 'fname' | 'federated'>[]>;
	getUsers: (u: string[]) => Promise<{ type: 'team' | 'user'; _id: string; username?: string; name?: string }[]>;
	getUser: (u: string) => Promise<IUser | null>;
	getTotalChannelMembers: (rid: string) => Promise<number>;
	onMaxRoomMembersExceeded: ({ sender, rid }: { sender: IMessage['u']; rid: string }) => Promise<void>;
};

export class MentionsServer extends MentionsParser {
	messageMaxAll: MentionsServerArgs['messageMaxAll'];

	getChannels: MentionsServerArgs['getChannels'];

	getUsers: MentionsServerArgs['getUsers'];

	getUser: MentionsServerArgs['getUser'];

	getTotalChannelMembers: MentionsServerArgs['getTotalChannelMembers'];

	onMaxRoomMembersExceeded: MentionsServerArgs['onMaxRoomMembersExceeded'];

	constructor(args: MentionsServerArgs) {
		super(args);

		this.messageMaxAll = args.messageMaxAll;
		this.getChannels = args.getChannels;
		this.getUsers = args.getUsers;
		this.getUser = args.getUser;
		this.getTotalChannelMembers = args.getTotalChannelMembers;
		this.onMaxRoomMembersExceeded =
			args.onMaxRoomMembersExceeded ||
			(() => {
				/* do nothing */
			});
	}

	async getUsersByMentions(message: IMessage): Promise<IMessage['mentions']> {
		const { msg, rid, u: sender, e2eMentions }: Pick<IMessage, 'msg' | 'rid' | 'u' | 't' | 'e2eMentions'> = message;

		const mentions =
			isE2EEMessage(message) && e2eMentions?.e2eUserMentions && e2eMentions?.e2eUserMentions.length > 0
				? e2eMentions?.e2eUserMentions
				: this.getUserMentions(msg);

		return this.convertMentionsToUsers(mentions, rid, sender);
	}

	async convertMentionsToUsers(mentions: string[], rid: string, sender: IMessage['u']): Promise<IMessage['mentions']> {
		const mentionsAll: { _id: string; username: string }[] = [];
		const userMentions = new Set<string>();

		for (const m of mentions) {
			let mention: string;
			if (m.includes(':')) {
				mention = m.trim();
			} else if (m.startsWith('@')) {
				mention = m.substring(1);
			} else {
				mention = m;
			}
			if (mention !== 'all' && mention !== 'here') {
				userMentions.add(mention);
				continue;
			}
			if (this.messageMaxAll() > 0 && (await this.getTotalChannelMembers(rid)) > this.messageMaxAll()) {
				await this.onMaxRoomMembersExceeded({ sender, rid });
				continue;
			}
			mentionsAll.push({
				_id: mention,
				username: mention,
			});
		}

		return [...mentionsAll, ...(userMentions.size ? await this.getUsers(Array.from(userMentions)) : [])];
	}

	async getChannelbyMentions(message: IMessage) {
		const { msg, e2eMentions }: Pick<IMessage, 'msg' | 't' | 'e2eMentions'> = message;

		const channels =
			isE2EEMessage(message) && e2eMentions?.e2eChannelMentions && e2eMentions?.e2eChannelMentions.length > 0
				? e2eMentions?.e2eChannelMentions
				: this.getChannelMentions(msg);
		return this.convertMentionsToChannels(channels);
	}

	async convertMentionsToChannels(channels: string[]): Promise<Pick<IRoom, '_id' | 'name' | 'fname' | 'federated'>[]> {
		return this.getChannels(channels.map((c) => (c.startsWith('#') ? c.substring(1) : c)));
	}

	async execute(message: IMessage) {
		if (message.md) {
			const { mentions, channels } = extractMentionsFromMessageAST(message.md);
			message.mentions = await this.convertMentionsToUsers(mentions, message.rid, message.u);
			message.channels = await this.convertMentionsToChannels(channels);
			return message;
		}

		message.mentions = await this.getUsersByMentions(message);
		message.channels = await this.getChannelbyMentions(message);

		return message;
	}
}
