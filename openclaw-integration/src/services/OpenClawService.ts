export interface OpenClawTaskRequest {
	task: string;
	roomId: string;
	userId: string;
}

export interface OpenClawTaskResponse {
	taskId: string;
	status?: string;
}

interface OpenClawApiCreateTaskResponse {
	task_id: string;
	status?: string;
}

export class OpenClawService {
	constructor(
		private readonly baseUrl: string,
		private readonly apiKey?: string,
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	public async createTask(payload: OpenClawTaskRequest): Promise<OpenClawTaskResponse> {
		const response = await this.fetchImpl(`${this.baseUrl.replace(/\/$/, '')}/tasks`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
			},
			body: JSON.stringify({
				task: payload.task,
				metadata: {
					room_id: payload.roomId,
					user_id: payload.userId,
				},
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			throw new Error(`OpenClaw task creation failed: ${response.status} ${errorBody}`);
		}

		const body = (await response.json()) as OpenClawApiCreateTaskResponse;
		if (!body.task_id) {
			throw new Error('OpenClaw task creation failed: missing task_id in API response');
		}

		return {
			taskId: body.task_id,
			status: body.status,
		};
	}
}
