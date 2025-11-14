import type { ChildProcess } from 'child_process';

import type { JsonRpc } from 'jsonrpc-lite';

import type { Encoder } from './codec';
import { newEncoder } from './codec';

export class ProcessMessenger {
	private deno: ChildProcess | undefined;

	private encoder: Encoder | undefined;

	private _sendStrategy: (message: JsonRpc) => void;

	constructor() {
		this._sendStrategy = this.strategyError;
	}

	public get send() {
		return this._sendStrategy.bind(this);
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

	private strategyError(_message: JsonRpc) {
		throw new Error('No process configured to receive a message');
	}

	private strategySend(message: JsonRpc) {
		this.deno.stdin.write(this.encoder.encode(message));
	}
}
