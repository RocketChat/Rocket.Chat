import { Socket, type TcpSocketConnectOpts } from 'node:net';

import type { ValueOf } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import { wrapExceptions } from '@rocket.chat/tools';
import { FreeSwitchResponse, type StringMap } from 'esl';

import { logger } from '../logger';

export type EventNames = Parameters<FreeSwitchResponse['event_json']>;

export type FreeSwitchESLClientOptions = {
	socketOptions: TcpSocketConnectOpts;
	password: string;
	timeout?: number;
};

export type FreeSwitchESLClientEvents = {
	ready: void;
	end: void;
	event: { eventName: ValueOf<EventNames>; eventData: StringMap };
};

export type FreeSwitchESLClientState = 'none' | 'connecting' | 'authenticating' | 'transitioning' | 'failed' | 'ready' | 'ended';

export class FreeSwitchESLClient extends Emitter<FreeSwitchESLClientEvents> {
	private state: FreeSwitchESLClientState = 'none';

	private socket: Socket;

	protected response: FreeSwitchResponse;

	private expectingEnd = false;

	public host: string | undefined;

	constructor(protected options: FreeSwitchESLClientOptions) {
		super();
		this.host = this.options.socketOptions.host;

		logger.debug('Connecting new FreeSwitch socket');
		this.socket = new Socket();
		this.response = new FreeSwitchResponse(this.socket, logger);

		this.socket.once('connect', () => {
			logger.debug('FreeSwitch socket connected.');
			this.authenticate();
		});

		this.socket.once('error', (error) => {
			logger.error({ msg: 'error on connection with freeswitch server', state: this.state, error });
			this.changeState('failed');
		});

		this.socket.once('end', () => {
			if (!this.expectingEnd) {
				logger.debug('FreeSwitchESLClient received `end` event (remote end sent a FIN packet)');
			}
			this.changeState('ended');
		});

		this.socket.on('warning', (data) => {
			logger.warn({ msg: 'FreeSwitchClient: warning', data });
		});

		try {
			this.socket.connect(this.options.socketOptions);
		} catch (error) {
			this.changeState('failed');
			logger.error({ msg: 'failed to connect to freeswitch server', error });
		}
	}

	private async authenticate(): Promise<void> {
		logger.debug('FreeSwitch socket authenticating.');
		this.changeState('authenticating');

		try {
			// Wait for FreeSwitch to send us an authentication request
			await this.response.onceAsync(
				'freeswitch_auth_request',
				this.options.timeout ?? 20_000,
				'FreeSwitchClient expected authentication request',
			);
			await this.response.auth(this.options.password);

			this.changeState('transitioning');

			this.response.auto_cleanup();
			await this.transitionToReady();
		} catch (error) {
			logger.error('FreeSwitchClient: initialization error', error);
			this.changeState('failed');
		}
	}

	protected async transitionToReady(): Promise<void> {
		this.changeState('ready');
	}

	protected changeState(newState: FreeSwitchESLClientState): void {
		logger.debug({ msg: 'FreeSwitchESLClient changing state .', newState, state: this.state });
		if (this.isDone()) {
			return;
		}

		this.state = newState;

		if (this.isReady()) {
			this.emit('ready');
			return;
		}

		if (this.isDone()) {
			this.emit('end');
		}
	}

	public isReady(): boolean {
		return this.state === 'ready';
	}

	public isDone(): boolean {
		return ['failed', 'ended'].includes(this.state);
	}

	public async waitUntilUsable(): Promise<void> {
		if (this.isReady()) {
			return;
		}

		if (this.isDone()) {
			throw new Error('connection-ended');
		}

		return new Promise((resolve, reject) => {
			let concluded = false;
			this.once('ready', () => {
				if (!concluded) {
					concluded = true;
					resolve();
				}
			});

			this.once('end', () => {
				if (!concluded) {
					concluded = true;
					reject(new Error('connection-ended'));
				}
			});
		});
	}

	public endConnection(): void {
		this.expectingEnd = true;
		wrapExceptions(() => this.response.end()).suppress();
	}
}
