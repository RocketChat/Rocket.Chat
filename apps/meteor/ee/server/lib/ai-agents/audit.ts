import type { ExtractDataToParams, IAuditServerActor, IServerEvents } from '@rocket.chat/core-typings';
import { ServerEvents } from '@rocket.chat/models';

export type AiAgentAuditData = {
	action: ExtractDataToParams<IServerEvents['ai-agent.changed']>['action'];
	engineId: string;
	seatId?: string;
	agentId?: string;
	version?: number;
	credentialId?: string;
	botUserIds?: string[];
	roomIds?: string[];
};

export function buildAuditUserActor(context: {
	userId?: string;
	user?: { _id?: string; username?: string };
	requestIp?: string;
	request?: Request;
}): IAuditServerActor {
	if (context.userId) {
		return {
			type: 'user',
			_id: context.userId,
			username: context.user?.username ?? '',
			ip: context.requestIp ?? '0.0.0.0',
			useragent: context.request?.headers.get('user-agent') ?? '',
		};
	}
	return { type: 'system', reason: 'ai-agents' };
}

/**
 * Writes an `ai-agent.changed` audit event carrying identifiers, action codes, and version numbers only.
 */
export async function recordAiAgentAuditEvent(data: AiAgentAuditData, actor: IAuditServerActor): Promise<void> {
	await ServerEvents.createAuditServerEvent('ai-agent.changed', data as ExtractDataToParams<IServerEvents['ai-agent.changed']>, actor);
}
