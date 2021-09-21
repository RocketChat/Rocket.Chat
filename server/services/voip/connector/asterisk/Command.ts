import { Logger, LogLevel } from '../../../../../lib/Logger';
import { IConnection } from './IConnection';
import { IVoipExtensionConfig, IVoipExtensionBase } from '../../../../../definition/IVoipExtension';

/**
 * This class serves as a a base class for the different kind of call server objects
 * @remarks
 */
export enum CommandType {
	ARI,
	AMI,
	AGI
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

	protected _connection: IConnection ;

	get connection(): IConnection {
		return this._connection;
	}

	set connection(connection: IConnection) {
		this._connection = connection;
	}

	private _actionId: any | undefined;

	get actionId(): any {
		return this._actionId;
	}

	set actionId(id) {
		this._actionId = id;
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

	protected logger: Logger | undefined;

	constructor(command: string, parametersNeeded: boolean) {
		this.logger = new Logger('Command');
		this.logger.setLogLevel(LogLevel.verbose);
		this._commandText = command;
		this._parametersNeeded = parametersNeeded;
		this.result = {};
	}

	protected prepareCommandAndExecution(amiCommand: any,
		actionResultCallback: (err: any, res: any) => void,
		eventHandlerSetupCallback: () => void): Promise <any> {
		const returnPromise = new Promise((_resolve, _reject) => {
			this.returnResolve = _resolve;
			this.returnReject = _reject;
			eventHandlerSetupCallback();
			this.connection.executeCommand?.(amiCommand, actionResultCallback);
		});
		return returnPromise;
	}

	executeCommand(_data: any): Promise <IVoipExtensionConfig | IVoipExtensionBase []> {
		return new Promise((_resolve, _reject) => {
			_reject('unimplemented');
		});
	}
}
