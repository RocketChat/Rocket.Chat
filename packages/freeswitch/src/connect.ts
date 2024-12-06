import { Socket, type SocketConnectOpts } from 'node:net';

import { FreeSwitchResponse } from 'esl';

import { logger } from './logger';

const defaultPassword = 'ClueCon';

export type EventNames = Parameters<FreeSwitchResponse['event_json']>;

export async function connect(
	options?: { host?: string; port?: number; password?: string },
	customEventNames: EventNames = [],
): Promise<FreeSwitchResponse> {
	const host = options?.host ?? '127.0.0.1';
	const port = options?.port ?? 8021;
	const password = options?.password ?? defaultPassword;

	return new Promise((resolve, reject) => {
		logger.debug({ msg: 'FreeSwitchClient::connect', options: { host, port } });

		const socket = new Socket();
		const currentCall = new FreeSwitchResponse(socket, logger);
		let connecting = true;

		socket.once('connect', () => {
			void (async (): Promise<void> => {
				connecting = false;
				try {
					// Normally when the client connects, FreeSwitch will first send us an authentication request. We use it to trigger the remainder of the stack.
					await currentCall.onceAsync('freeswitch_auth_request', 20_000, 'FreeSwitchClient expected authentication request');
					await currentCall.auth(password);
					currentCall.auto_cleanup();
					await currentCall.event_json('CHANNEL_EXECUTE_COMPLETE', 'BACKGROUND_JOB', ...customEventNames);
				} catch (error) {
					logger.error('FreeSwitchClient: connect error', error);
					reject(error);
				}

				if (currentCall) {
					resolve(currentCall);
				}
			})();
		});

		socket.once('error', (error) => {
			if (!connecting) {
				return;
			}

			logger.error({ msg: 'failed to connect to freeswitch server', error });
			connecting = false;
			reject(error);
		});

		socket.once('end', () => {
			if (!connecting) {
				return;
			}

			logger.debug('FreeSwitchClient::connect: client received `end` event (remote end sent a FIN packet)');
			connecting = false;
			reject(new Error('connection-ended'));
		});

		socket.on('warning', (data) => {
			if (!connecting) {
				return;
			}

			logger.warn({ msg: 'FreeSwitchClient: warning', data });
		});

		try {
			logger.debug('FreeSwitchClient::connect: socket.connect', { options: { host, port } });
			socket.connect({
				host,
				port,
				password,
			} as unknown as SocketConnectOpts);
		} catch (error) {
			logger.error('FreeSwitchClient::connect: socket.connect error', { error });
			connecting = false;
			reject(error);
		}
	});
}
