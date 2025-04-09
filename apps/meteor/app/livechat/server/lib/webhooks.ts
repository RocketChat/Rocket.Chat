import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { webhooksLogger } from './logger';
import { metrics } from '../../../metrics/server';
import { settings } from '../../../settings/server';

export async function sendRequest(
	postData: {
		type: string;
		[key: string]: any;
	},
	attempts = 10,
) {
	if (!attempts) {
		webhooksLogger.error({ msg: 'Omnichannel webhook call failed. Max attempts reached' });
		return;
	}
	const timeout = settings.get<number>('Livechat_http_timeout');
	const secretToken = settings.get<string>('Livechat_secret_token');
	const webhookUrl = settings.get<string>('Livechat_webhookUrl');
	try {
		webhooksLogger.debug({ msg: 'Sending webhook request', postData });
		const result = await fetch(webhookUrl, {
			method: 'POST',
			headers: {
				...(secretToken && { 'X-RocketChat-Livechat-Token': secretToken }),
			},
			body: postData,
			timeout,
		});

		if (result.status === 200) {
			metrics.totalLivechatWebhooksSuccess.inc();
			return result;
		}

		metrics.totalLivechatWebhooksFailures.inc();
		throw new Error(await result.text());
	} catch (err) {
		const retryAfter = timeout * 4;
		webhooksLogger.error({ msg: `Error response on ${11 - attempts} try ->`, err });
		// try 10 times after 20 seconds each
		attempts - 1 && webhooksLogger.warn({ msg: `Webhook call failed. Retrying`, newAttemptAfterSeconds: retryAfter / 1000, webhookUrl });
		setTimeout(async () => {
			await sendRequest(postData, attempts - 1);
		}, retryAfter);
	}
}
