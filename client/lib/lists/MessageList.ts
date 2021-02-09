import type { IMessage } from '../../../definition/IMessage';
import { RecordList } from './RecordList';

export class MessageList extends RecordList<IMessage> {
	protected filter(message: IMessage): boolean {
		return message._hidden !== true;
	}

	protected compare(a: IMessage, b: IMessage): number {
		return a.ts.getTime() - b.ts.getTime();
	}
}
