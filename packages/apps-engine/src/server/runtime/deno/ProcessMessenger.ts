import type { ChildProcess } from 'child_process';

import type { JsonRpc } from 'jsonrpc-lite';

import type { COMMAND_PING } from './LivenessManager';
import type { Encoder } from './codec';
import { newEncoder } from './codec';

type Message = JsonRpc | typeof COMMAND_PING;

export class ProcessMessenger {
	private deno: ChildProcess | undefined;

	private encoder: Encoder | undefined;

	private _sendStrategy: (message: Message) => void;

	constructor() {
		this._sendStrategy = this.strategyError;
	}

	public send(message: Message) {
		this._sendStrategy(message);
	}

	public setReceiver(deno: ChildProcess) {
		this.deno = deno;

		this.switchStrategy();
	}

	public clearReceiver() {
		delete this.deno;
		delete this.encoder;

		this.switchStrategy();
	}

	private switchStrategy() {
		if (this.deno?.stdin?.writable) {
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
		this.deno.stdin.write(this.encoder.encode(message));
	}
}
