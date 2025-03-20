import type { IIntegration } from '@rocket.chat/core-typings';

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
