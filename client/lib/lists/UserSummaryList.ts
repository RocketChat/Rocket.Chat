import { MessageList } from './MessageList';
import type { IMessage } from '../../../definition/IMessage';
import { escapeRegExp } from '../../../lib/escapeRegExp';

type UserMessage = Omit<IMessage, 'drid'> & Required<Pick<IMessage, 'drid'>>;

export type UserMessageListOptions = {
	rid: IMessage['rid'];
	text?: string;
};

const isDiscussionMessageInRoom = (message: IMessage, rid: IMessage['rid']): message is UserMessage =>
	message.rid === rid && 'rid' in message;

const isDiscussionTextMatching = (discussionMessage: UserMessage, regex: RegExp): boolean =>
	regex.test(discussionMessage.msg);

export class UserMessageList extends MessageList {
	public constructor(private _options: UserMessageListOptions) {
		super();
	}

	public get options(): UserMessageListOptions {
		return this._options;
	}

	public updateFilters(options: UserMessageListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this._options;

		if (!isDiscussionMessageInRoom(message, rid)) {
			return false;
		}

		if (this._options.text) {
			const regex = new RegExp(
				this._options.text.split(/\s/g)
					.map((text) => escapeRegExp(text)).join('|'),
			);
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
