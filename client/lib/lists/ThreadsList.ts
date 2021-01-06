import { MessageList } from './MessageList';
import type { IMessage } from '../../../definition/IMessage';
import { IUser } from '../../../definition/IUser';
import { ISubscription } from '../../../definition/ISubscription';
import { escapeRegExp } from '../../../lib/escapeRegExp';

type ThreadMessage = IMessage & { tcount: number };

type ThreadsListOptions = {
	rid: IMessage['rid'];
	text?: string;
}
& (
	{
		type: 'unread';
		tunread: ISubscription['tunread'];
	}
	| {
		type: 'following';
		uid: IUser['_id'];
	}
	| {
		type: null;
	}
);

const isThreadMessageInRoom = (message: IMessage, rid: IMessage['rid']): message is ThreadMessage =>
	message.rid === rid && typeof (message as ThreadMessage).tcount === 'number';

const isThreadFollowedByUser = (threadMessage: ThreadMessage, uid: IUser['_id']): boolean =>
	threadMessage.replies?.includes(uid) ?? false;

const isThreadUnread = (threadMessage: ThreadMessage, tunread: ISubscription['tunread']): boolean =>
	tunread.includes(threadMessage._id);

const isThreadTextMatching = (threadMessage: ThreadMessage, regex: RegExp): boolean =>
	regex.test(threadMessage.msg);

const createFilter = (options: ThreadsListOptions): ((message: IMessage) => boolean) => {
	const optionalFilters: ((message: ThreadMessage) => boolean)[] = [];

	if (options.type === 'following') {
		const { uid } = options;
		optionalFilters.push((message): boolean => isThreadFollowedByUser(message, uid));
	}

	if (options.type === 'unread') {
		const { tunread } = options;
		optionalFilters.push((message): boolean => isThreadUnread(message, tunread));
	}

	if (options.text) {
		const regex = new RegExp(options.text.split(/\s/g).map((text) => escapeRegExp(text)).join('|'));
		optionalFilters.push((message): boolean => isThreadTextMatching(message, regex));
	}

	const { rid } = options;

	return (message): boolean => {
		if (!isThreadMessageInRoom(message, rid)) {
			return false;
		}

		return optionalFilters.every((filter) => filter(message));
	};
};

const compareThreadMessages = (a: IMessage, b: IMessage): number =>
	(b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime();

export class ThreadsList extends MessageList {
	public constructor(options: ThreadsListOptions) {
		super(createFilter(options), compareThreadMessages);
	}
}
