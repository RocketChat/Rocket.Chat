import { Emitter } from '@rocket.chat/emitter';

import type { Connection } from './Connection';
import type { DDPClient } from './types/DDPClient';

export interface TimeoutControlEvents
	extends Emitter<{
		timeout: void;
		heartbeat: void;
	}> {
	reset(): void;
	stop(): void;
	readonly timeout: number;
	readonly heartbeat: number;
}

export class TimeoutControl
	extends Emitter<{
		timeout: void;
		heartbeat: void;
	}>
	implements TimeoutControlEvents
{
	private timeoutId: ReturnType<typeof setTimeout> | undefined;

	private heartbeatId: ReturnType<typeof setTimeout> | undefined;

	constructor(readonly timeout: number = 60_000, readonly heartbeat: number = timeout / 2) {
		super();
		/* istanbul ignore next */
		if (this.heartbeat >= this.timeout) {
			throw new Error('Heartbeat must be less than timeout');
		}
	}

	reset() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		if (this.heartbeatId) {
			clearTimeout(this.heartbeatId);
		}
		this.timeoutId = setTimeout(() => this.emit('timeout'), this.timeout);
		this.heartbeatId = setTimeout(() => this.emit('heartbeat'), this.heartbeat);
	}

	stop() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}
		if (this.heartbeatId) {
			clearTimeout(this.heartbeatId);
		}
	}

	static create(ddp: DDPClient, connection: Connection, timeout?: number, heartbeat?: number): TimeoutControl {
		const timeoutControl = new TimeoutControl(timeout, heartbeat);

		timeoutControl.on('heartbeat', () => {
			ddp.ping();
		});

		timeoutControl.on('timeout', () => {
			connection.close();
		});

		ddp.onMessage(() => timeoutControl.reset());

		connection.on('close', () => {
			timeoutControl.stop();
		});

		connection.on('disconnected', () => {
			timeoutControl.stop();
		});

		connection.on('connected', () => {
			timeoutControl.reset();
		});

		return timeoutControl;
	}
}
