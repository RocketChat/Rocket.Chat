import type { ChildProcess } from 'node:child_process';

import type { JsonRpc } from 'jsonrpc-lite';

import type { COMMAND_PING } from './LivenessManager';
import { sanitizeForIpc } from '../../../lib/IpcSanitizer';

type Message = JsonRpc | typeof COMMAND_PING;

export class ProcessMessenger {
	private process: ChildProcess | undefined;

	private _sendStrategy: (message: Message) => void;

	constructor() {
		this._sendStrategy = this.strategyError;
	}

	public send(message: Message) {
		this._sendStrategy(message);
	}

	public setReceiver(process: ChildProcess) {
		this.process = process;

		this.switchStrategy();
	}

	public clearReceiver() {
		delete this.process;

		this.switchStrategy();
	}

	private switchStrategy() {
		if (this.process?.connected) {
			this._sendStrategy = this.strategySend.bind(this);
		} else {
			this._sendStrategy = this.strategyError.bind(this);
		}
	}

	private strategyError(_message: Message) {
		throw new Error('No process configured to receive a message');
	}

	private strategySend(message: Message) {
		if (!this.process?.connected) {
			throw new Error('The IPC channel to the subprocess is closed');
		}

		this.process.send(sanitizeForIpc(message));
	}
}
