import { EventEmitter } from 'events';
import net from 'net';
import util from 'util';

import { Logger } from '@rocket.chat/logger';

import localCommandHandlers from './localCommandHandlers';
import parseMessage from './parseMessage';
import peerCommandHandlers from './peerCommandHandlers';

const logger = new Logger('IRC Server');

class RFC2813 {
	constructor(config) {
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
	setupSocket() {
		// Setup socket
		this.socket = new net.Socket();
		this.socket.setNoDelay();
		this.socket.setEncoding('utf-8');
		this.socket.setKeepAlive(true);
		this.socket.setTimeout(90000);

		this.socket.on('data', this.onReceiveFromPeer.bind(this));

		this.socket.on('connect', this.onConnect.bind(this));
		this.socket.on('error', (err) => logger.error(err));
		this.socket.on('timeout', () => this.log('Timeout'));
		this.socket.on('close', () => this.log('Connection Closed'));
		// Setup local
		this.on('onReceiveFromLocal', this.onReceiveFromLocal.bind(this));
	}

	/**
	 * Log helper
	 */
	log(message) {
		// TODO logger: debug?
		logger.info(message);
	}

	/**
	 * Connect
	 */
	register() {
		this.log(`Connecting to @${this.config.server.host}:${this.config.server.port}`);

		if (!this.socket) {
			this.setupSocket();
		}

		this.socket.connect(this.config.server.port, this.config.server.host);
	}

	/**
	 * Disconnect
	 */
	disconnect() {
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
	onConnect() {
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
	write(command) {
		let buffer = command.prefix ? `:${command.prefix} ` : '';
		buffer += command.command;

		if (command.parameters && command.parameters.length > 0) {
			buffer += ` ${command.parameters.join(' ')}`;
		}

		if (command.trailer) {
			buffer += ` :${command.trailer}`;
		}

		this.log(`Sending Command: ${buffer}`);

		return this.socket.write(`${buffer}\r\n`);
	}

	/**
	 *
	 *
	 * Peer message handling
	 *
	 *
	 */
	onReceiveFromPeer(chunk) {
		if (typeof chunk === 'string') {
			this.receiveBuffer += chunk;
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

				if (peerCommandHandlers[parsedMessage.command]) {
					this.log(`Handling peer message: ${line}`);

					const command = peerCommandHandlers[parsedMessage.command].call(this, parsedMessage);

					if (command) {
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
	 *
	 *
	 * Local message handling
	 *
	 *
	 */
	onReceiveFromLocal(command, parameters) {
		if (localCommandHandlers[command]) {
			this.log(`Handling local command: ${command}`);

			localCommandHandlers[command].call(this, parameters, this);
		} else {
			this.log({ msg: 'Unhandled local command', command });
		}
	}
}

util.inherits(RFC2813, EventEmitter);

export default RFC2813;
