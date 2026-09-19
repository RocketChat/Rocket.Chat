import { OpenClawService } from '../services/OpenClawService';
import { TaskStore } from '../storage/TaskStore';

export interface ClawCommandInput {
	commandText: string;
	roomId: string;
	userId: string;
}

export interface ClawCommandResult {
	message: string;
	taskId: string;
}

export class ClawCommand {
	constructor(
		private readonly openClawService: OpenClawService,
		private readonly taskStore: TaskStore,
	) {}

	public async execute(input: ClawCommandInput): Promise<ClawCommandResult> {
		const task = input.commandText.trim();
		if (!task) {
			throw new Error('Missing task text. Usage: /claw <task>');
		}

		const taskResponse = await this.openClawService.createTask({
			task,
			roomId: input.roomId,
			userId: input.userId,
		});

		this.taskStore.save({
			taskId: taskResponse.taskId,
			roomId: input.roomId,
			userId: input.userId,
			commandText: task,
			createdAt: new Date(),
		});

		return {
			taskId: taskResponse.taskId,
			message: '🧠 OpenClaw is processing your request...',
		};
	}
}
