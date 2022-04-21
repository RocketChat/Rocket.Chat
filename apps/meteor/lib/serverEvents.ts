import events from 'events';

import { ServerEventType } from '@rocket.chat/core-typings';

import { Logger } from '../app/logger/server';

const logger = new Logger('ServerEventsEmitter');

function handleError(err: Error): void {
	if (!(err instanceof Error)) {
		err = Error(err);
	}
	logger.error(`error handler: ${err.message}`, 'yellow');
}

function wrapHandler(fn: (...args: any[]) => void) {
	return function (...evtArgs: any[]): void {
		new Promise((resolve) => {
			resolve(fn(...evtArgs));
		}).catch((e) => {
			handleError(e);
		});
	};
}

export class ServerEvents extends events.EventEmitter {
	addEventListener(event: string, listener: (...args: any[]) => void): this {
		if (!Object.values<string>(ServerEventType).includes(event)) {
			throw new Error('Cannot register to unrecognized event');
		}

		return this.addListener(event, wrapHandler(listener));
	}
}

export const serverEvents = new ServerEvents();
export const IServerEventTypes = ServerEventType;
