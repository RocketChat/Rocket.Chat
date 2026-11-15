import type { IEnvironmentalVariableRead } from '@rocket.chat/apps-engine/definition/accessors';

import { bridgeCall } from '../../bridges/bridgeCall';
import type * as Messenger from '../../messenger';

export class EnvironmentalVariableRead implements IEnvironmentalVariableRead {
	constructor(private readonly senderFn: typeof Messenger.sendRequest) {}

	public getValueByName(envVarName: string): Promise<string> {
		return bridgeCall<string>(this.senderFn, 'getEnvironmentalVariableBridge', 'doGetValueByName', envVarName, 'APP_ID');
	}

	public isReadable(envVarName: string): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getEnvironmentalVariableBridge', 'doIsReadable', envVarName, 'APP_ID');
	}

	public isSet(envVarName: string): Promise<boolean> {
		return bridgeCall<boolean>(this.senderFn, 'getEnvironmentalVariableBridge', 'doIsSet', envVarName, 'APP_ID');
	}
}
