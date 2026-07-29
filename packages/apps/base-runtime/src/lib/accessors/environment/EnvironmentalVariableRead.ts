import type { IEnvironmentalVariableRead } from '@rocket.chat/apps-engine/definition/accessors';

import type { RemoteBridges } from '../../bridges/RemoteBridges';

export class EnvironmentalVariableRead implements IEnvironmentalVariableRead {
	constructor(private readonly bridges: RemoteBridges) {}

	public getValueByName(envVarName: string): Promise<string> {
		return this.bridges.getEnvironmentalVariableBridge().doGetValueByName(envVarName, 'APP_ID') as Promise<string>;
	}

	public isReadable(envVarName: string): Promise<boolean> {
		return this.bridges.getEnvironmentalVariableBridge().doIsReadable(envVarName, 'APP_ID') as Promise<boolean>;
	}

	public isSet(envVarName: string): Promise<boolean> {
		return this.bridges.getEnvironmentalVariableBridge().doIsSet(envVarName, 'APP_ID') as Promise<boolean>;
	}
}
