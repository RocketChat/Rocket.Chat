import type { IIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';

export interface IScriptClass {
	prepare_outgoing_request?: (params: Record<string, any>) => any;
	process_outgoing_response?: (params: Record<string, any>) => any;
	process_incoming_request?: (params: Record<string, any>) => any;
}

export type FullScriptClass = Required<IScriptClass>;

export type SandboxLog = {
	level: 'log' | 'warn' | 'error';
	message: string;
	timestamp: Date;
};

export type CompiledScript = {
	script: Partial<IScriptClass>;
	store: Record<string, any>;
	logs?: SandboxLog[];
	_updatedAt: Date;
};

export type IntegrationExecutionLog = SandboxLog;

export type CompatibilityScriptResult = IScriptClass & {
	availableFunctions: (keyof IScriptClass)[];
};

export const isOutgoingIntegration = (
	integration: Partial<IIntegration>,
): integration is IOutgoingIntegration & { type: 'webhook-outgoing' } =>
	integration.type === 'webhook-outgoing' && 'event' in integration && integration.event !== undefined;
