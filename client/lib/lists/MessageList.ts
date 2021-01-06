import type { IMessage } from '../../../definition/IMessage';
import { RecordList } from './RecordList';

const wrapFilter = (filter?: (message: IMessage) => boolean): (message: IMessage) => boolean => {
	if (!filter) {
		return (message): boolean => message._hidden !== true;
	}

	return (message): boolean => message._hidden !== true && filter(message);
};

export class MessageList extends RecordList<IMessage> {
	public constructor(
		filter?: (message: IMessage) => boolean,
		compare: (a: IMessage, b: IMessage) => number = (a, b): number =>
			a.ts.getTime() - b.ts.getTime(),
	) {
		super(wrapFilter(filter), compare);
	}
}
