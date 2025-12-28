import type { IIntegration, IOutgoingIntegration } from '@rocket.chat/core-typings';

export interface IScriptClass {
	prepare_outgoing_request?: (params: Record<string, any>) => any;
	process_outgoing_response?: (params: Record<string, any>) => any;
	process_incoming_request?: (params: Record<string, any>) => any;
}

export type FullScriptClass = Required<IScriptClass>;

export type CompiledScript = {
	script: Partial<IScriptClass>;
	store: Record<string, any>;
	_updatedAt: IIntegration['_updatedAt'];
};

export type CompatibilityScriptResult = IScriptClass & {
	availableFunctions: (keyof IScriptClass)[];
};

export const isOutgoingIntegration = (
	integration: Partial<IIntegration>,
): integration is IOutgoingIntegration & { type: 'webhook-outgoing' } =>
	integration.type === 'webhook-outgoing' && 'event' in integration && integration.event !== undefined;
