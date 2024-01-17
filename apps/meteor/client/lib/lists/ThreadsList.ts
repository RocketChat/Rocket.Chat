import type { IMessage, ISubscription, IUser } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { MessageList } from './MessageList';

type ThreadMessage = Omit<IMessage, 'tcount'> & Required<Pick<IMessage, 'tcount'>>;

export type ThreadsListOptions = {
	rid: IMessage['rid'];
	text?: string;
} & (
	| {
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

const isThreadFollowedByUser = (threadMessage: ThreadMessage, uid: IUser['_id']): boolean => threadMessage.replies?.includes(uid) ?? false;

const isThreadUnread = (threadMessage: ThreadMessage, tunread: ISubscription['tunread']): boolean =>
	Boolean(tunread?.includes(threadMessage._id));

const isThreadTextMatching = (threadMessage: ThreadMessage, regex: RegExp): boolean => regex.test(threadMessage.msg);

export class ThreadsList extends MessageList {
	public constructor(private _options: ThreadsListOptions) {
		super();
	}

	public get options(): ThreadsListOptions {
		return this._options;
	}

	public updateFilters(options: ThreadsListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this._options;

		if (!isThreadMessageInRoom(message, rid)) {
			return false;
		}

		if (this._options.type === 'following') {
			const { uid } = this._options;
			if (!isThreadFollowedByUser(message, uid)) {
				return false;
			}
		}

		if (this._options.type === 'unread') {
			const { tunread } = this._options;
			if (!isThreadUnread(message, tunread)) {
				return false;
			}
		}

		if (this._options.text) {
			const regex = new RegExp(escapeRegExp(this._options.text), 'i');
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
