import type { ChildProcess } from 'node:child_process';

import type { COMMAND_PING } from './LivenessManager';
import { sanitizeForIpc } from '../../../lib/IpcSanitizer';
import type { JsonRpc } from '../../../lib/jsonrpc';

type Message = JsonRpc | typeof COMMAND_PING;

export class ProcessMessenger {
	private process: ChildProcess | undefined;

	private _sendStrategy: (message: Message) => Promise<void>;

	constructor() {
		this._sendStrategy = this.strategyError;
	}

	/**
	 * Settles once Node hands the message to the IPC channel, and rejects when
	 * the message cannot be serialized or the channel is closed.
	 */
	public send(message: Message): Promise<void> {
		return this._sendStrategy(message);
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

	private async strategyError(_message: Message): Promise<void> {
		throw new Error('No process configured to receive a message');
	}

	private strategySend(message: Message): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.process?.connected) {
				reject(new Error('The IPC channel to the subprocess is closed'));
				return;
			}

			this.process.send(sanitizeForIpc(message), (error) => (error ? reject(error) : resolve()));
		});
	}
}
