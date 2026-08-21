import type { ChildProcess } from 'node:child_process';

import type { JsonRpc } from 'jsonrpc-lite';

import type { COMMAND_PING } from './LivenessManager';
import type { Encoder } from './codec';
import { newEncoder } from './codec';

type Message = JsonRpc | typeof COMMAND_PING;

export class ProcessMessenger {
	private process: ChildProcess | undefined;

	private encoder: Encoder | undefined;

	private _sendStrategy: (message: Message) => void;

	/**
	 * @param onSend - optional hook invoked with the number of bytes of each
	 * encoded message written to the subprocess, used to measure the throughput
	 * of the host → runtime channel.
	 */
	constructor(private readonly onSend?: (bytes: number) => void) {
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
		const encoded = this.encoder.encode(message);

		this.onSend?.(encoded.byteLength);

		this.process.stdin.write(encoded);
	}
}
