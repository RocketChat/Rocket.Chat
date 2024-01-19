import type { IIntegration } from '@rocket.chat/core-typings';
import { VM, VMScript } from 'vm2';

import { IntegrationScriptEngine } from '../ScriptEngine';
import type { IScriptClass } from '../definition';
import { buildSandbox, type Vm2Sandbox } from './buildSandbox';

const DISABLE_INTEGRATION_SCRIPTS = ['yes', 'true', 'vm2'].includes(String(process.env.DISABLE_INTEGRATION_SCRIPTS).toLowerCase());

export class VM2ScriptEngine<IsIncoming extends boolean> extends IntegrationScriptEngine<IsIncoming> {
	protected isDisabled(): boolean {
		return DISABLE_INTEGRATION_SCRIPTS;
	}

	protected buildSandbox(store: Record<string, any> = {}): { store: Record<string, any>; sandbox: Vm2Sandbox<IsIncoming> } {
		return buildSandbox<IsIncoming>(store, this.incoming);
	}

	protected async runScriptMethod({
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
		const { sandbox } = this.buildSandbox(this.compiledScripts[integrationId].store);

		const vm = new VM({
			timeout: 3000,
			sandbox: {
				...sandbox,
				script,
				method,
				params,
				...(this.incoming && 'request' in params ? { request: params.request } : {}),
			},
		});

		return new Promise((resolve, reject) => {
			process.nextTick(async () => {
				try {
					const scriptResult = await vm.run(`
						new Promise((resolve, reject) => {
							scriptTimeout(reject);
							try {
								resolve(script[method](params))
							} catch(e) {
								reject(e);
							}
						}).catch((error) => { throw new Error(error); });
					`);

					resolve(scriptResult);
				} catch (e) {
					reject(e);
				}
			});
		});
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
		const { store, sandbox } = this.buildSandbox();

		try {
			this.logger.info({ msg: 'Will evaluate script of Trigger', integration: integration.name });
			this.logger.debug(script);

			const vmScript = new VMScript(`${script}; Script;`, 'script.js');
			const vm = new VM({
				sandbox,
			});

			const ScriptClass = vm.run(vmScript);

			if (ScriptClass) {
				this.compiledScripts[integration._id] = {
					script: new ScriptClass(),
					store,
					_updatedAt: integration._updatedAt,
				};

				return this.compiledScripts[integration._id].script;
			}
		} catch (err) {
			this.logger.error({
				msg: 'Error evaluating Script in Trigger',
				integration: integration.name,
				script,
				err,
			});
			throw new Error('error-evaluating-script');
		}

		this.logger.error({ msg: 'Class "Script" not in Trigger', integration: integration.name });
		throw new Error('class-script-not-found');
	}
}
