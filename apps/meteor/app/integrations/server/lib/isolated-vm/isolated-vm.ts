import type { IIntegration, ValueOf } from '@rocket.chat/core-typings';
import { pick } from '@rocket.chat/tools';
import ivm, { type Reference } from 'isolated-vm';

import { IntegrationScriptEngine } from '../ScriptEngine';
import type { IScriptClass, CompatibilityScriptResult, FullScriptClass } from '../definition';
import { buildSandbox } from './buildSandbox';
import { getCompatibilityScript } from './getCompatibilityScript';

const DISABLE_INTEGRATION_SCRIPTS = ['yes', 'true', 'ivm'].includes(String(process.env.DISABLE_INTEGRATION_SCRIPTS).toLowerCase());

export class IsolatedVMScriptEngine<IsIncoming extends boolean> extends IntegrationScriptEngine<IsIncoming> {
	protected isDisabled(): boolean {
		return DISABLE_INTEGRATION_SCRIPTS;
	}

	protected async callScriptFunction(
		scriptReference: Reference<ValueOf<IScriptClass>>,
		...params: Parameters<ValueOf<FullScriptClass>>
	): Promise<any> {
		return scriptReference.applySync(undefined, params, {
			arguments: { copy: true },
			result: { copy: true, promise: true },
		});
	}

	protected async runScriptMethod({
		script,
		method,
		params,
	}: {
		integrationId: IIntegration['_id'];
		script: Partial<IScriptClass>;
		method: keyof IScriptClass;
		params: Record<string, any>;
	}): Promise<any> {
		const fn = script[method];

		if (typeof fn !== 'function') {
			throw new Error('integration-method-not-found');
		}

		return fn(params);
	}

	protected async getIntegrationScript(integration: IIntegration): Promise<Partial<IScriptClass>> {
		if (this.disabled) {
			throw new Error('integration-scripts-disabled');
		}

		const compiledScript = this.compiledScripts[integration._id];
		if (compiledScript && +compiledScript._updatedAt === +integration._updatedAt) {
			return compiledScript.script;
		}

		const script = integration.scriptCompiled;
		try {
			this.logger.info({ msg: 'Will evaluate the integration script', integration: pick(integration, 'name', '_id') });
			this.logger.debug(script);

			const isolate = new ivm.Isolate({ memoryLimit: 8 });

			const ivmScript = await isolate.compileScript(getCompatibilityScript(script));

			const ivmContext = isolate.createContextSync();
			buildSandbox(ivmContext);

			const ivmResult: Reference<CompatibilityScriptResult> = await ivmScript.run(ivmContext, {
				reference: true,
				timeout: 3000,
			});

			const availableFunctions = await ivmResult.get('availableFunctions', { copy: true });
			const scriptFunctions = Object.fromEntries(
				availableFunctions.map((functionName) => {
					const fnReference = ivmResult.getSync(functionName, { reference: true });
					return [functionName, (...params: Parameters<ValueOf<FullScriptClass>>) => this.callScriptFunction(fnReference, ...params)];
				}),
			) as Partial<IScriptClass>;

			this.compiledScripts[integration._id] = {
				script: scriptFunctions,
				store: {},
				_updatedAt: integration._updatedAt,
			};

			return scriptFunctions;
		} catch (err: any) {
			this.logger.error({
				msg: 'Error evaluating integration script',
				integration: integration.name,
				script,
				err,
			});

			throw new Error('error-evaluating-script');
		}
	}
}
