import type { ChildProcess } from 'node:child_process';

import type { COMMAND_PING } from './LivenessManager';
import type { Encoder } from './codec';
import { newEncoder } from './codec';
import type { JsonRpc } from '../../../lib/jsonrpc';

type Message = JsonRpc | typeof COMMAND_PING;

export class ProcessMessenger {
	private process: ChildProcess | undefined;

	private encoder: Encoder | undefined;

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
		delete this.encoder;

		this.switchStrategy();
	}

	private switchStrategy() {
		if (this.process?.stdin?.writable) {
			this._sendStrategy = this.strategySend.bind(this);

			// Get a clean encoder
			this.encoder = newEncoder();
		} else {
			this._sendStrategy = this.strategyError.bind(this);
		}
	}

	private strategyError(_message: Message) {
		throw new Error('No process configured to receive a message');
	}

	private strategySend(message: Message) {
		this.process.stdin.write(this.encoder.encode(message));
	}
}
