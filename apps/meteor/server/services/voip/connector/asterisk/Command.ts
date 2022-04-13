import { Db } from 'mongodb';
import type { IVoipConnectorResult } from '@rocket.chat/core-typings';

import { IConnection } from './IConnection';

/**
 * This class serves as a a base class for the different kind of call server objects
 * @remarks
 */
export enum CommandType {
	ARI,
	AMI,
	AGI,
}

export class Command {
	protected _type: CommandType;

	public get type(): CommandType {
		return this._type;
	}

	private _commandText: string;

	public get commandText(): string {
		return this._commandText;
	}

	private _parametersNeeded: boolean;

	public get parametersNeeded(): boolean {
		return this._parametersNeeded;
	}

	protected _connection: IConnection;

	get connection(): IConnection {
		return this._connection;
	}

	set connection(connection: IConnection) {
		this._connection = connection;
	}

	private _actionid: any | undefined;

	get actionid(): any {
		return this._actionid;
	}

	set actionid(id) {
		this._actionid = id;
	}

	private _result: any;

	get result(): any {
		return this._result;
	}

	set result(res) {
		this._result = res;
	}

	private _returnResolve: (result: any) => void;

	get returnResolve(): (result: any) => void {
		return this._returnResolve;
	}

	set returnResolve(resolve) {
		this._returnResolve = resolve;
	}

	private _returnReject: (result: any) => void;

	get returnReject(): any {
		return this._returnReject;
	}

	set returnReject(reject) {
		this._returnReject = reject;
	}

	private _db: Db;

	get db(): any {
		return this._db;
	}

	set db(db: Db) {
		this._db = db;
	}

	constructor(command: string, parametersNeeded: boolean, db: Db) {
		this._commandText = command;
		this._actionid = -1;
		this._parametersNeeded = parametersNeeded;
		this.result = {};
		this._db = db;
	}

	protected prepareCommandAndExecution(
		amiCommand: any,
		actionResultCallback: (err: any, res: any) => void,
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

	executeCommand(_data: any): Promise<IVoipConnectorResult> {
		return new Promise((_resolve, _reject) => {
			_reject('unimplemented');
		});
	}

	initMonitor(_data: any): boolean {
		return true;
	}

	cleanMonitor(): boolean {
		return true;
	}
}
