import type { IMessage } from '../../../definition/IMessage';
import { MessageList } from './MessageList';

type FilesMessage = Omit<IMessage, 'rid'> & Required<Pick<IMessage, 'rid'>>;

export type FilesListOptions = {
	rid: IMessage['rid'];
	type: string;
	text: string;
};

const isFileMessageInRoom = (message: IMessage, rid: IMessage['rid']): message is FilesMessage => message.rid === rid && 'rid' in message;

export class FilesList extends MessageList {
	public constructor(private _options: FilesListOptions) {
		super();
	}

	public get options(): FilesListOptions {
		return this._options;
	}

	public updateFilters(options: FilesListOptions): void {
		this._options = options;
		this.clear();
	}

	protected filter(message: IMessage): boolean {
		const { rid } = this._options;

		if (!isFileMessageInRoom(message, rid)) {
			return false;
		}

		return true;
	}

	protected compare(a: IMessage, b: IMessage): number {
		return (b.tlm ?? b.ts).getTime() - (a.tlm ?? a.ts).getTime();
	}
}
