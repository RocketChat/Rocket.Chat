/*
 * Mentions is a named function that will process Mentions
 * @param {Object} message - The message object
 */
import { isE2EEMessage, type IMessage, type IRoom, type IUser } from '@rocket.chat/core-typings';

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
		const mentionsAll: { _id: string; username: string }[] = [];
		const userMentions = [];

		for await (const m of mentions) {
			const mention = m.trim().substr(1);
			if (mention !== 'all' && mention !== 'here') {
				userMentions.push(mention);
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

		return [...mentionsAll, ...(userMentions.length ? await this.getUsers(userMentions) : [])];
	}

	async getChannelbyMentions(message: IMessage) {
		const { msg, e2eMentions }: Pick<IMessage, 'msg' | 't' | 'e2eMentions'> = message;

		const channels =
			isE2EEMessage(message) && e2eMentions?.e2eChannelMentions && e2eMentions?.e2eChannelMentions.length > 0
				? e2eMentions?.e2eChannelMentions
				: this.getChannelMentions(msg);
		return this.getChannels(channels.map((c) => c.trim().substr(1)));
	}

	async execute(message: IMessage) {
		const mentionsAll = await this.getUsersByMentions(message);
		const channels = await this.getChannelbyMentions(message);

		message.mentions = mentionsAll;
		message.channels = channels;

		return message;
	}
}
