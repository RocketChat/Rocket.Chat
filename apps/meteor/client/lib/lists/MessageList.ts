import type { IMessage } from '@rocket.chat/core-typings';

import { RecordList } from './RecordList';

export class MessageList<T extends IMessage = IMessage> extends RecordList<T> {
	protected filter(message: T): boolean {
		return message._hidden !== true;
	}

	protected compare(a: T, b: T): number {
		return a.ts.getTime() - b.ts.getTime();
	}
}
