import type { ILivechatTrigger } from '@rocket.chat/core-typings';
import { LivechatTrigger } from '@rocket.chat/models';
import type { PaginatedResult } from '@rocket.chat/rest-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

export async function findTriggers({
	pagination: { offset, count, sort },
}: {
	pagination: { offset: number; count: number; sort: Record<string, number> };
}): Promise<PaginatedResult<{ triggers: Array<ILivechatTrigger> }>> {
	const { cursor, totalCount } = LivechatTrigger.findPaginated(
		{},
		{
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
		},
	);

	const [triggers, total] = await Promise.all([cursor.toArray(), totalCount]);

	return {
		triggers,
		count: triggers.length,
		offset,
		total,
	};
}

export async function findTriggerById({ triggerId }: { triggerId: string }): Promise<ILivechatTrigger | null> {
	return LivechatTrigger.findOneById(triggerId);
}

export async function deleteTrigger({ triggerId }: { triggerId: string }): Promise<void> {
	await LivechatTrigger.removeById(triggerId);
}

export async function callTriggerExternalService({
	url,
	timeout,
	fallbackMessage,
	body,
	headers,
}: {
	url: string;
	timeout: number;
	fallbackMessage: string;
	body: Record<string, any>;
	headers: Record<string, string>;
}) {
	try {
		const response = await fetch(url, { timeout, body, headers, method: 'POST' });

		if (!response.ok || response.status !== 200) {
			const text = await response.text();
			throw new Error(text);
		}

		const data = await response.json();

		const { contents } = data;

		if (
			!Array.isArray(contents) ||
			!contents.length ||
			!contents.every(({ msg, order }) => typeof msg === 'string' && typeof order === 'number')
		) {
			throw new Error('External service response does not match expected format');
		}

		return {
			response: {
				statusCode: response.status,
				contents: data?.contents || [],
			},
		};
	} catch (error: any) {
		const isTimeout = error.message === 'The user aborted a request.';
		return {
			error: isTimeout ? 'error-timeout' : 'error-invalid-webhook-response',
			response: error.message,
			fallbackMessage,
		};
	}
}
