import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { settings } from '../../../settings/server';
import { openclawLogger } from '../logger';

export interface OpenClawAgentPayload {
	message: string;
	channel_id: string;
	channel_name?: string;
	user_id: string;
	user_name: string;
	callback_url?: string;
	model?: string;
	thread_id?: string;
}

export interface OpenClawWakePayload {
	event: string;
	data: Record<string, unknown>;
}

export interface OpenClawResponse {
	success: boolean;
	message?: string;
	response?: string;
	error?: string;
}

function getConfig(): { apiUrl: string; authToken: string; model: string } {
	const apiUrl = settings.get<string>('OpenClaw_API_URL');
	const authToken = settings.get<string>('OpenClaw_Auth_Token');
	const model = settings.get<string>('OpenClaw_Default_Model');

	return { apiUrl, authToken, model };
}

function isEnabled(): boolean {
	return settings.get<boolean>('OpenClaw_Enabled') === true;
}

function validateConfig(): { valid: boolean; error?: string } {
	if (!isEnabled()) {
		return { valid: false, error: 'OpenClaw integration is not enabled. Enable it in Admin → Settings → OpenClaw.' };
	}

	const { apiUrl, authToken } = getConfig();

	if (!apiUrl) {
		return { valid: false, error: 'OpenClaw API URL is not configured. Set it in Admin → Settings → OpenClaw.' };
	}

	if (!authToken) {
		return { valid: false, error: 'OpenClaw authentication token is not configured. Set it in Admin → Settings → OpenClaw.' };
	}

	return { valid: true };
}

/**
 * Send a message to the OpenClaw agent for processing.
 * Posts to the OpenClaw `/hooks/agent` endpoint.
 */
export async function sendToAgent(payload: OpenClawAgentPayload): Promise<OpenClawResponse> {
	const validation = validateConfig();
	if (!validation.valid) {
		return { success: false, error: validation.error };
	}

	const { apiUrl, authToken, model } = getConfig();
	const url = `${apiUrl.replace(/\/+$/, '')}/hooks/agent`;

	if (model && !payload.model) {
		payload.model = model;
	}

	openclawLogger.info({ msg: 'Sending message to OpenClaw agent', url, channel: payload.channel_id });
	openclawLogger.debug({ payload });

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify(payload),
			timeout: 30000,
		});

		const contentType = response.headers.get('content-type') || '';
		let data: Record<string, unknown> | null = null;

		if (contentType.includes('application/json')) {
			try {
				data = (await response.json()) as Record<string, unknown>;
			} catch {
				data = null;
			}
		}

		if (!response.ok) {
			const errorMsg = data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`;
			openclawLogger.error({ msg: 'OpenClaw agent request failed', status: response.status, error: errorMsg });
			return { success: false, error: String(errorMsg) };
		}

		openclawLogger.info({ msg: 'OpenClaw agent response received', status: response.status });

		return {
			success: true,
			response: data?.response as string | undefined,
			message: data?.message as string | undefined,
		};
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		openclawLogger.error({ msg: 'OpenClaw agent request error', error: errorMsg });
		return { success: false, error: `Failed to connect to OpenClaw: ${errorMsg}` };
	}
}

/**
 * Send a wake event to the OpenClaw agent.
 * Posts to the OpenClaw `/hooks/wake` endpoint.
 */
export async function wakeAgent(payload: OpenClawWakePayload): Promise<OpenClawResponse> {
	const validation = validateConfig();
	if (!validation.valid) {
		return { success: false, error: validation.error };
	}

	const { apiUrl, authToken } = getConfig();
	const url = `${apiUrl.replace(/\/+$/, '')}/hooks/wake`;

	openclawLogger.info({ msg: 'Sending wake event to OpenClaw', url, event: payload.event });

	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify(payload),
			timeout: 10000,
		});

		if (!response.ok) {
			openclawLogger.error({ msg: 'OpenClaw wake request failed', status: response.status });
			return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
		}

		return { success: true };
	} catch (err) {
		const errorMsg = err instanceof Error ? err.message : String(err);
		openclawLogger.error({ msg: 'OpenClaw wake request error', error: errorMsg });
		return { success: false, error: `Failed to connect to OpenClaw: ${errorMsg}` };
	}
}

export { isEnabled, validateConfig };
