import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import type { OpenClawAgentPayload } from './openclawClient';
import { sendToAgent, isEnabled } from './openclawClient';
import { settings } from '../../../settings/server';
import { openclawLogger } from '../logger';

/**
 * Determine if a message should be forwarded to OpenClaw.
 * Filters out bot messages, system messages, and checks if integration is enabled.
 */
export function shouldProcessMessage(message: IMessage): boolean {
	// Skip if not enabled
	if (!isEnabled()) {
		return false;
	}

	// Skip system messages
	if (message.t) {
		return false;
	}

	// Skip empty messages
	if (!message.msg || message.msg.trim().length === 0) {
		return false;
	}

	// Skip messages from bots to prevent infinite loops
	if (message.bot) {
		return false;
	}

	// Skip messages from the OpenClaw bot user
	const botUsername = settings.get<string>('OpenClaw_Bot_Username');
	if (botUsername && message.u?.username === botUsername) {
		return false;
	}

	return true;
}

/**
 * Format a Rocket.Chat message into an OpenClaw agent payload.
 */
export function formatMessagePayload(
	message: IMessage,
	room: IRoom,
	callbackUrl?: string,
): OpenClawAgentPayload {
	const respondInThread = settings.get<boolean>('OpenClaw_Respond_In_Thread');

	return {
		message: message.msg || '',
		channel_id: room._id,
		channel_name: room.name || room._id,
		user_id: message.u._id,
		user_name: message.u.username || '',
		...(callbackUrl && { callback_url: callbackUrl }),
		...(respondInThread && message._id && { thread_id: message.tmid || message._id }),
	};
}

/**
 * Process a message and forward it to the OpenClaw agent.
 * Returns the agent's response text, or null if no response.
 */
export async function forwardMessageToAgent(
	message: IMessage,
	room: IRoom,
	callbackUrl?: string,
): Promise<string | null> {
	if (!shouldProcessMessage(message)) {
		return null;
	}

	const payload = formatMessagePayload(message, room, callbackUrl);

	openclawLogger.info({
		msg: 'Forwarding message to OpenClaw agent',
		messageId: message._id,
		roomId: room._id,
	});

	const result = await sendToAgent(payload);

	if (!result.success) {
		openclawLogger.error({
			msg: 'Failed to forward message to OpenClaw',
			error: result.error,
		});
		return null;
	}

	return result.response || result.message || null;
}

/**
 * Get the bot user for posting OpenClaw responses.
 */
export async function getOpenClawBotUser() {
	const botUsername = settings.get<string>('OpenClaw_Bot_Username') || 'openclaw.bot';

	const user = await Users.findOneByUsername(botUsername);
	if (user) {
		return user;
	}

	// Fall back to rocket.cat if the configured bot user doesn't exist
	openclawLogger.warn({
		msg: 'OpenClaw bot user not found, falling back to rocket.cat',
		botUsername,
	});

	return Users.findOneByUsername('rocket.cat');
}

/**
 * Resolve a room by ID.
 */
export async function getRoomById(roomId: string): Promise<IRoom | null> {
	const room = await Rooms.findOneById(roomId);
	return room || null;
}
