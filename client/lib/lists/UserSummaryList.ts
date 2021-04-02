import { MessageList } from './MessageList';
import type { IMessage } from '../../../definition/IMessage';
import { escapeRegExp } from '../../../lib/escapeRegExp';

type UserMessage = Omit<IMessage, 'drid'> & Required<Pick<IMessage, 'drid'>>;

export type UserSummaryListOptions = {
	rid: IMessage['rid'];
	text?: string;
};

const MessageInRoom = (message: IMessage, rid: IMessage['rid']): message is UserMessage =>
	message.rid === rid && 'rid' in message;

const isTextMatching = (discussionMessage: UserMessage, regex: RegExp): boolean =>
	regex.test(discussionMessage.msg);

export class UserSummaryList extends MessageList {
	public constructor(private _options: UserSummaryListOptions) {
		super();
	}

	public get options(): UserSummaryListOptions {
		return this._options;
	}

	public updateFilters(options: UserSummaryListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this._options;

		if (!MessageInRoom(message, rid)) {
			return false;
		}

		if (this._options.text) {
			const regex = new RegExp(
				this._options.text.split(/\s/g)
					.map((text) => escapeRegExp(text)).join('|'),
			);
			if (!isTextMatching(message, regex)) {
				return false;
			}
		}

		return true;
	}

	protected compare(a: IMessage, b: IMessage): number {
		return (b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime();
	}
}
