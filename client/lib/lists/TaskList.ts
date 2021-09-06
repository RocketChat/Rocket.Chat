import type { ITask } from '../../../definition/ITask';
import { RecordList } from './RecordList';

export class TaskList extends RecordList<ITask> {
	protected filter(message: ITask): boolean {
		return message._hidden !== true;
	}

	protected compare(a: ITask, b: ITask): number {
		return a.ts.getTime() - b.ts.getTime();
	}
}
