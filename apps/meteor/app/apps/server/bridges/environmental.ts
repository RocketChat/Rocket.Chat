import { EnvironmentalVariableBridge } from '@rocket.chat/apps-engine/server/bridges/EnvironmentalVariableBridge';

import { AppServerOrchestrator } from '../orchestrator';

export class AppEnvironmentalVariableBridge extends EnvironmentalVariableBridge {
	allowed: Array<string>;

	// eslint-disable-next-line no-empty-function
	constructor(private readonly orch: AppServerOrchestrator) {
		super();
		this.allowed = ['NODE_ENV', 'ROOT_URL', 'INSTANCE_IP'];
	}

	protected async getValueByName(envVarName: string, appId: string): Promise<string | undefined> {
		this.orch.debugLog(`The App ${appId} is getting the environmental variable value ${envVarName}.`);

		if (!(await this.isReadable(envVarName, appId))) {
			throw new Error(`The environmental variable "${envVarName}" is not readable.`);
		}

		return process.env[envVarName];
	}

	protected async isReadable(envVarName: string, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is checking if the environmental variable is readable ${envVarName}.`);

		return this.allowed.includes(envVarName.toUpperCase()) || this.isAppsOwnVariable(envVarName, appId);
	}

	protected isAppsOwnVariable(envVarName: string, appId: string): boolean {
		/**
		 * Replace the letter `-` with `_` since environment variable name doesn't support it
		 */
		const appVariablePrefix = `RC_APPS_${appId.toUpperCase().replace(/-/g, '_')}`;
		return envVarName.toUpperCase().startsWith(appVariablePrefix);
	}

	protected async isSet(envVarName: string, appId: string): Promise<boolean> {
		this.orch.debugLog(`The App ${appId} is checking if the environmental variable is set ${envVarName}.`);

		if (!(await this.isReadable(envVarName, appId))) {
			throw new Error(`The environmental variable "${envVarName}" is not readable.`);
		}

		return typeof process.env[envVarName] !== 'undefined';
	}
}
