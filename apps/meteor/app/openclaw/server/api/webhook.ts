import { timingSafeEqual } from 'crypto';

import { isPlainObject } from '../../../../lib/utils/isPlainObject';
import { API } from '../../../api/server/api';
import { processWebhookMessage } from '../../../lib/server/functions/processWebhookMessage';
import { settings } from '../../../settings/server';
import { openclawLogger } from '../logger';
import { getOpenClawBotUser, getRoomById } from '../lib/messageHandler';

function safeCompare(a: string, b: string): boolean {
	if (a.length !== b.length) {
		return false;
	}
	return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

API.v1.addRoute(
	'openclaw.webhook',
	{ authRequired: false },
	{
		async post() {
			openclawLogger.info({ msg: 'Received OpenClaw webhook callback' });

			if (settings.get<boolean>('OpenClaw_Enabled') !== true) {
				openclawLogger.warn({ msg: 'OpenClaw webhook received but integration is disabled' });
				return API.v1.failure('OpenClaw integration is disabled');
			}

			const body = this.bodyParams;
			if (!isPlainObject(body)) {
				return API.v1.failure('Invalid request body');
			}

			const expectedToken = settings.get<string>('OpenClaw_Auth_Token');
			const receivedToken = body.token as string | undefined;

			if (!expectedToken || !receivedToken || !safeCompare(receivedToken, expectedToken)) {
				openclawLogger.warn({ msg: 'OpenClaw webhook token validation failed' });
				return API.v1.unauthorized('Invalid webhook token');
			}

			const channelId = body.channel_id as string | undefined;
			const text = body.text as string | undefined;

			if (!channelId) {
				return API.v1.failure('Missing required field: channel_id');
			}

			if (!text || text.trim().length === 0) {
				return API.v1.failure('Missing required field: text');
			}

			const room = await getRoomById(channelId);
			if (!room) {
				openclawLogger.error({ msg: 'Target room not found for OpenClaw webhook', channelId });
				return API.v1.failure('Target room not found');
			}

			const botUser = await getOpenClawBotUser();
			if (!botUser || !botUser.username) {
				openclawLogger.error({ msg: 'OpenClaw bot user not found' });
				return API.v1.failure('Bot user not found');
			}

			const threadId = body.thread_id as string | undefined;
			const alias = (body.alias as string) || 'OpenClaw AI';
			const avatar = (body.avatar as string) || '';
			const emoji = (body.emoji as string) || ':robot:';

			const messagePayload: Record<string, unknown> = {
				text,
				channel: `#${room._id}`,
				...(threadId && { tmid: threadId }),
			};

			const defaultValues = {
				alias,
				avatar,
				emoji,
				channel: `#${room._id}`,
			};

			try {
				const result = await processWebhookMessage(
					messagePayload,
					{ ...botUser, username: botUser.username },
					defaultValues,
				);

				if (!result || result.length === 0) {
					openclawLogger.error({ msg: 'Failed to process OpenClaw webhook message' });
					return API.v1.failure('Failed to deliver message');
				}

				openclawLogger.info({
					msg: 'OpenClaw webhook message delivered successfully',
					roomId: channelId,
					messageCount: result.length,
				});

				return API.v1.success({ message: 'Message delivered' });
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				openclawLogger.error({ msg: 'Error processing OpenClaw webhook', error: errorMsg });
				return API.v1.failure(`Error delivering message: ${errorMsg}`);
			}
		},
	},
);
