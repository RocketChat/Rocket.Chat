import { Db } from 'mongodb';
import type { IVoipConnectorResult } from '@rocket.chat/core-typings';

import { IConnection } from './IConnection';
import type { AmiCommand, CommandType, CommandParams } from './asterisk.types';

export abstract class Command {
	public type: CommandType;

	public commandText: string;

	public parametersNeeded: boolean;

	public connection: IConnection;

	public actionid: string;

	public returnResolve: (result: IVoipConnectorResult) => void;

	public returnReject: (result: any) => void;

	public db: Db;

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		this.commandText = command;
		this.actionid = '-1';
		this.parametersNeeded = parametersNeeded;
		this.db = db;
	}

	protected prepareCommandAndExecution(
		amiCommand: AmiCommand,
		actionResultCallback: (err: Error, res: any) => void,
		eventHandlerSetupCallback: () => void,
	): Promise<any> {
		const returnPromise = new Promise((_resolve, _reject) => {
			this.returnResolve = _resolve;
			this.returnReject = _reject;
			eventHandlerSetupCallback();
			this.connection.executeCommand(amiCommand, actionResultCallback);
		});
		return returnPromise;
	}

	abstract executeCommand(_data?: CommandParams): Promise<IVoipConnectorResult>;
}
