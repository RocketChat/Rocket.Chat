import type { IAuditServerEventType } from '../IServerEvent';

export type AiAgentAuditAction =
	| 'engine.link'
	| 'engine.rotate-credential'
	| 'engine.revoke-credential'
	| 'engine.reserve-bots'
	| 'seat.register'
	| 'seat.retire'
	| 'agent.create'
	| 'agent.retry'
	| 'agent.disable';

/**
 * Audit event for AI agent control-plane mutations. Carries identifiers, action codes, and version numbers only —
 * never agent names, instructions, or secret material.
 */
export interface IServerEventAiAgentChanged extends IAuditServerEventType<
	| {
			key: 'action';
			value: AiAgentAuditAction;
	  }
	| {
			key: 'engineId';
			value: string;
	  }
	| {
			key: 'seatId';
			value: string | undefined;
	  }
	| {
			key: 'agentId';
			value: string | undefined;
	  }
	| {
			key: 'version';
			value: number | undefined;
	  }
	| {
			key: 'credentialId';
			value: string | undefined;
	  }
	| {
			key: 'botUserIds';
			value: string[] | undefined;
	  }
	| {
			key: 'roomIds';
			value: string[] | undefined;
	  }
> {
	t: 'ai-agent.changed';
}
