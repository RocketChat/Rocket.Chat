import type { IIntegration } from '@rocket.chat/core-typings';
import ivm, { type Reference } from 'isolated-vm';

import { IntegrationScriptEngine } from '../ScriptEngine';
import type { IScriptClass, CompatibilityScriptResult } from '../definition';
import { buildSandbox } from './buildSandbox';
import { getCompatibilityScript } from './getCompatibilityScript';

const DISABLE_INTEGRATION_SCRIPTS = ['yes', 'true', 'ivm'].includes(String(process.env.DISABLE_INTEGRATION_SCRIPTS || '').toLowerCase());

export class IsolatedVMScriptEngine<IsIncoming extends boolean> extends IntegrationScriptEngine<IsIncoming> {
	protected override async runScriptMethod({
		integrationId,
		script,
		method,
		params,
	}: {
		integrationId: IIntegration['_id'];
		script: IScriptClass;
		method: keyof IScriptClass;
		params: Record<string, any>;
	}): Promise<any> {
		if (this.disabled) {
			throw new Error('integration-scripts-disabled');
		}

		const fn = script[method] as (...args: any[]) => any | Promise<any> | undefined;
		if (!fn || typeof fn !== 'function') {
			return;
		}

		const compiled = this.compiledScripts?.[integrationId];
		const store = compiled?.store ?? {};
		try {
			return await Promise.resolve(fn(params, store));
		} catch (err) {
			throw err;
		}
	}

	protected isDisabled(): boolean {
		return DISABLE_INTEGRATION_SCRIPTS;
	}

	protected async callScriptFunction(ref: Reference<any>, ...params: any[]): Promise<any> {
		return ref.applySync(undefined, params, {
			arguments: { copy: true },
			result: { copy: true, promise: true },
		});
	}

	protected async getIntegrationScript(integration: IIntegration): Promise<Partial<IScriptClass>> {
		if (this.disabled) {
			throw new Error('integration-scripts-disabled');
		}

		const cached = this.compiledScripts[integration._id];
		if (cached && +cached._updatedAt === +integration._updatedAt) {
			return cached.script;
		}

		const isolate = new ivm.Isolate({ memoryLimit: 8 });
		const script = await isolate.compileScript(getCompatibilityScript(integration.scriptCompiled));
		const context = isolate.createContextSync();
		const { logs } = buildSandbox(context);
		this.compiledScripts[integration._id] = {
			script: {},
			store: {},
			logs,
			_updatedAt: integration._updatedAt,
		};
		const result: Reference<CompatibilityScriptResult> = await script.run(context, { reference: true, timeout: 3000 });

		const availableFunctions = await result.get('availableFunctions', { copy: true });

		const scriptFunctions = Object.fromEntries(
			availableFunctions.map((name: string) => {
				const fnRef = result.getSync(name as keyof IScriptClass, { reference: true });
				return [name, (...params: any[]) => this.callScriptFunction(fnRef, ...params)];
			}),
		);

		this.compiledScripts[integration._id] = {
			script: scriptFunctions,
			store: {},
			logs,
			_updatedAt: integration._updatedAt,
		};

		return scriptFunctions;
	}
}
