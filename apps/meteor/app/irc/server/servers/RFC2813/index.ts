import { EventEmitter } from 'events';
import net from 'net';

import { Logger } from '@rocket.chat/logger';

import localCommandHandlers from './localCommandHandlers';
import parseMessage from './parseMessage';
import peerCommandHandlers from './peerCommandHandlers';

const logger = new Logger('IRC Server');

type Config = {
	server: {
		name: string;
		host: string;
		port: number;
		description: string;
	};
	passwords: {
		local: string;
	};
};

type Command = {
	prefix?: string;
	command: string;
	parameters?: string[];
	trailer?: string;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
interface RFC2813 extends EventEmitter {
	on(event: 'onReceiveFromLocal', listener: (command: string, parameters: any) => void): this;
	on(event: 'peerCommand', listener: (command: any) => void): this;
	on(event: string | symbol, listener: (...args: any[]) => void): this;
	emit(event: 'peerCommand', command: any): boolean;
	emit(event: 'onReceiveFromLocal', command: string, parameters: any): boolean;
	emit(event: string | symbol, ...args: any[]): boolean;
}

class RFC2813 extends EventEmitter {
	config: Config;

	registerSteps: string[];

	isRegistered: boolean;

	serverPrefix: string | null;

	receiveBuffer: Buffer;

	socket?: net.Socket;

	constructor(config: Config) {
		super();
		this.config = config;

		// Hold registered state
		this.registerSteps = [];
		this.isRegistered = false;

		// Hold peer server information
		this.serverPrefix = null;

		// Hold the buffer while receiving
		this.receiveBuffer = Buffer.from('');
	}

	/**
	 * Setup socket
	 */
	setupSocket(): void {
		// Setup socket
		this.socket = new net.Socket();
		this.socket.setNoDelay();
		this.socket.setEncoding('utf-8');
		this.socket.setKeepAlive(true);
		this.socket.setTimeout(90000);

		this.socket.on('data', this.onReceiveFromPeer.bind(this));

		this.socket.on('connect', this.onConnect.bind(this));
		this.socket.on('error', (err) => logger.error({ msg: 'Socket error', err }));
		this.socket.on('timeout', () => this.log({ msg: 'Timeout' }));
		this.socket.on('close', () => this.log({ msg: 'Connection Closed' }));
		// Setup local
		this.on('onReceiveFromLocal', this.onReceiveFromLocal.bind(this));
	}

	/**
	 * Log helper
	 */
	log(message: string | Record<string, any>): void {
		// TODO logger: debug?
		if (typeof message === 'string') {
			logger.info({ msg: message });
			return;
		}

		logger.info(message);
	}

	/**
	 * Connect
	 */
	register(): void {
		this.log({
			msg: 'Connecting to IRC server',
			host: this.config.server.host,
			port: this.config.server.port,
		});

		if (!this.socket) {
			this.setupSocket();
		}

		this.socket!.connect(this.config.server.port, this.config.server.host);
	}

	/**
	 * Disconnect
	 */
	disconnect(): void {
		this.log('Disconnecting from server.');

		if (this.socket) {
			this.socket.destroy();
			this.socket = undefined;
		}
		this.isRegistered = false;
		this.registerSteps = [];
	}

	/**
	 * Setup the server connection
	 */
	onConnect(): void {
		this.log('Connected! Registering as server...');

		this.write({
			command: 'PASS',
			parameters: [this.config.passwords.local, '0210', 'ngircd'],
		});

		this.write({
			command: 'SERVER',
			parameters: [this.config.server.name],
			trailer: this.config.server.description,
		});
	}

	/**
	 * Sends a command message through the socket
	 */
	write(command: Command): boolean {
		let buffer = command.prefix ? `:${command.prefix} ` : '';
		buffer += command.command;

		if (command.parameters && command.parameters.length > 0) {
			buffer += ` ${command.parameters.join(' ')}`;
		}

		if (command.trailer) {
			buffer += ` :${command.trailer}`;
		}

		this.log({ msg: 'Sending Command', buffer });

		return this.socket!.write(`${buffer}\r\n`);
	}

	/**
	 *
	 *
	 * Peer message handling
	 *
	 *
	 */
	onReceiveFromPeer(chunk: string | Buffer): void {
		if (typeof chunk === 'string') {
			this.receiveBuffer = Buffer.concat([this.receiveBuffer, Buffer.from(chunk)]);
		} else {
			this.receiveBuffer = Buffer.concat([this.receiveBuffer, chunk]);
		}

		const lines = this.receiveBuffer.toString().split(/\r\n|\r|\n|\u0007/); // eslint-disable-line no-control-regex

		// If the buffer does not end with \r\n, more chunks are coming
		if (lines.pop()) {
			return;
		}

		// Reset the buffer
		this.receiveBuffer = Buffer.from('');

		lines.forEach((line) => {
			if (line.length && !line.startsWith('a')) {
				const parsedMessage = parseMessage(line);

				if (peerCommandHandlers[parsedMessage.command as keyof typeof peerCommandHandlers]) {
					this.log({ msg: 'Handling peer message', line });

					const command = peerCommandHandlers[parsedMessage.command as keyof typeof peerCommandHandlers].call(this, parsedMessage);

					if (command !== undefined) {
						this.log({ msg: 'Emitting peer command to local', command });
						this.emit('peerCommand', command);
					}
				} else {
					this.log({ msg: 'Unhandled peer message', parsedMessage });
				}
			}
		});
	}

	/**
	 * Local message handling
	 */
	onReceiveFromLocal(command: string, parameters: any): void {
		if (localCommandHandlers[command as keyof typeof localCommandHandlers]) {
			this.log({ msg: 'Handling local command', command });

			localCommandHandlers[command as keyof typeof localCommandHandlers].call(this, parameters, this);
		} else {
			this.log({ msg: 'Unhandled local command', command });
		}
	}
}

export default RFC2813;
