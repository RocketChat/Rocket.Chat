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
		type: 'all';
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

export class ThreadsList extends MessageList {
	public constructor(private options: ThreadsListOptions) {
		super();
	}

	public updateFilters(options: ThreadsListOptions): void {
		this.options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this.options;

		if (!isThreadMessageInRoom(message, rid)) {
			return false;
		}

		if (this.options.type === 'following') {
			const { uid } = this.options;
			if (!isThreadFollowedByUser(message, uid)) {
				return false;
			}
		}

		if (this.options.type === 'unread') {
			const { tunread } = this.options;
			if (!isThreadUnread(message, tunread)) {
				return false;
			}
		}

		if (this.options.text) {
			const regex = new RegExp(
				this.options.text.split(/\s/g)
					.map((text) => escapeRegExp(text)).join('|'),
			);
			if (!isThreadTextMatching(message, regex)) {
				return false;
			}
		}

		return true;
	}

	protected compare(a: IMessage, b: IMessage): number {
		return (b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime();
	}
}
