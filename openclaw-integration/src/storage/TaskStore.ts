export interface TaskRecord {
	taskId: string;
	roomId: string;
	userId: string;
	commandText: string;
	createdAt: Date;
}

export class TaskStore {
	private readonly tasksById = new Map<string, TaskRecord>();

	public save(record: TaskRecord): void {
		this.tasksById.set(record.taskId, record);
	}

	public getByTaskId(taskId: string): TaskRecord | undefined {
		return this.tasksById.get(taskId);
	}

	public listByRoomId(roomId: string): TaskRecord[] {
		return Array.from(this.tasksById.values()).filter((record) => record.roomId === roomId);
	}

	public listByUserId(userId: string): TaskRecord[] {
		return Array.from(this.tasksById.values()).filter((record) => record.userId === userId);
	}
}
