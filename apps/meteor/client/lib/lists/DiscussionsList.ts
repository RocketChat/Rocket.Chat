import type { IMessage } from '@rocket.chat/core-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { MessageList } from './MessageList';

type DiscussionMessage = Omit<IMessage, 'drid'> & Required<Pick<IMessage, 'drid'>>;

export type DiscussionsListOptions = {
	rid: IMessage['rid'];
	text?: string;
};

const isDiscussionMessageInRoom = (message: IMessage, rid: IMessage['rid']): message is DiscussionMessage =>
	message.rid === rid && 'drid' in message;

const isDiscussionTextMatching = (discussionMessage: DiscussionMessage, regex: RegExp): boolean => regex.test(discussionMessage.msg);

export class DiscussionsList extends MessageList {
	public constructor(private _options: DiscussionsListOptions) {
		super();
	}

	public get options(): DiscussionsListOptions {
		return this._options;
	}

	public updateFilters(options: DiscussionsListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this._options;

		if (!isDiscussionMessageInRoom(message, rid)) {
			return false;
		}

		if (this._options.text) {
			const regex = new RegExp(escapeRegExp(this._options.text), 'i');
			if (!isDiscussionTextMatching(message, regex)) {
				return false;
			}
		}

		return true;
	}

	protected compare(a: IMessage, b: IMessage): number {
		return (b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime();
	}
}
