import type { Request, Response, RequestHandler } from 'express';
import { ClawCommand } from '../commands/ClawCommand';

export interface RocketChatSlashCommandPayload {
	token?: string;
	command?: string;
	text?: string;
	room_id?: string;
	user_id?: string;
	channel_name?: string;
	user_name?: string;
}

export class SlashCommandHandler {
	constructor(private readonly clawCommand: ClawCommand) {}

	public handle: RequestHandler = async (req: Request, res: Response): Promise<void> => {
		const body = req.body as RocketChatSlashCommandPayload;
		const commandText = body.text ?? '';
		const roomId = body.room_id ?? '';
		const userId = body.user_id ?? '';

		if (!roomId || !userId) {
			res.status(400).json({
				text: 'Invalid slash command payload: room_id and user_id are required',
			});
			return;
		}

		try {
			await this.clawCommand.execute({
				commandText,
				roomId,
				userId,
			});

			res.status(200).json({
				response_type: 'ephemeral',
				text: '🧠 OpenClaw is processing your request...',
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error';
			res.status(400).json({
				response_type: 'ephemeral',
				text: `Unable to process /claw command: ${message}`,
			});
		}
	};
}
