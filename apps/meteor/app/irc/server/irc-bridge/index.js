import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';
import moment from 'moment';
import Queue from 'queue-fifo';

import { callbacks } from '../../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../lib/callbacks/afterLeaveRoomCallback';
import { afterLogoutCleanUpCallback } from '../../../../lib/callbacks/afterLogoutCleanUpCallback';
import { withThrottling } from '../../../../lib/utils/highOrderFunctions';
import * as servers from '../servers';
import * as localCommandHandlers from './localHandlers';
import * as peerCommandHandlers from './peerHandlers';

const logger = new Logger('IRC Bridge');
const queueLogger = logger.section('Queue');

let removed = false;
const updateLastPing = withThrottling({ wait: 10_000 })(() => {
	if (removed) {
		return;
	}
	void Settings.updateOne(
		{ _id: 'IRC_Bridge_Last_Ping' },
		{
			$set: {
				value: new Date(),
			},
		},
		{ upsert: true },
	);
});

class Bridge {
	constructor(config) {
		// General
		this.config = config;

		// Workaround for Rocket.Chat callbacks being called multiple times
		this.loggedInUsers = [];

		// Server
		const Server = servers[this.config.server.protocol];

		this.server = new Server(this.config);

		this.setupPeerHandlers();
		this.setupLocalHandlers();

		// Command queue
		this.queue = new Queue();
		this.queueTimeout = 5;
	}

	async init() {
		this.initTime = new Date();
		removed = false;
		this.loggedInUsers = [];

		const lastPing = await Settings.findOneById('IRC_Bridge_Last_Ping');
		if (lastPing) {
			if (Math.abs(moment(lastPing.value).diff()) < 1000 * 30) {
				this.log('Not trying to connect.');
				this.remove();
				return;
			}
		}

		this.log('Connecting.');
		updateLastPing();
		this.server.register();

		this.server.on('registered', () => {
			this.logQueue('Starting...');

			this.runQueue();
		});
	}

	stop() {
		this.server.disconnect();
	}

	remove() {
		this.log('Removing current connection.');
		removed = true;
		this.server = null;
		this.removeLocalHandlers();
	}

	/**
	 * Log helper
	 */
	log(message) {
		// TODO logger: debug?
		logger.info(message);
	}

	logQueue(message) {
		// TODO logger: debug?
		queueLogger.info(message);
	}

	/**
	 *
	 *
	 * Queue
	 *
	 *
	 */
	onMessageReceived(from, command, ...parameters) {
		this.queue.enqueue({ from, command, parameters });
	}

	async runQueue() {
		if (!this.server) {
			return;
		}

		const lastResetTime = Settings.findOneById('IRC_Bridge_Reset_Time');
		if (lastResetTime && lastResetTime.value > this.initTime) {
			this.stop();
			this.remove();
			return;
		}

		updateLastPing();

		// If it is empty, skip and keep the queue going
		if (this.queue.isEmpty()) {
			return setTimeout(this.runQueue.bind(this), this.queueTimeout);
		}

		// Get the command
		const item = this.queue.dequeue();

		this.logQueue(`Processing "${item.command}" command from "${item.from}"`);

		// Handle the command accordingly
		try {
			// Handle the command accordingly
			switch (item.from) {
				case 'local':
					if (!localCommandHandlers[item.command]) {
						throw new Error(`Could not find handler for local:${item.command}`);
					}

					await localCommandHandlers[item.command].apply(this, item.parameters);
					break;
				case 'peer':
					if (!peerCommandHandlers[item.command]) {
						throw new Error(`Could not find handler for peer:${item.command}`);
					}

					await peerCommandHandlers[item.command].apply(this, item.parameters);
					break;
			}
		} catch (e) {
			this.logQueue(e);
		}

		// Keep the queue going
		setTimeout(this.runQueue.bind(this), this.queueTimeout);
	}

	/**
	 *
	 *
	 * Peer
	 *
	 *
	 */
	setupPeerHandlers() {
		this.server.on('peerCommand', (cmd) => {
			this.onMessageReceived('peer', cmd.identifier, cmd.args);
		});
	}

	/**
	 *
	 *
	 * Local
	 *
	 *
	 */
	setupLocalHandlers() {
		// Auth
		callbacks.add('afterValidateLogin', this.onMessageReceived.bind(this, 'local', 'onLogin'), callbacks.priority.LOW, 'irc-on-login');
		callbacks.add(
			'afterCreateUser',
			this.onMessageReceived.bind(this, 'local', 'onCreateUser'),
			callbacks.priority.LOW,
			'irc-on-create-user',
		);
		// Joining rooms or channels
		callbacks.add(
			'afterCreateChannel',
			this.onMessageReceived.bind(this, 'local', 'onCreateRoom'),
			callbacks.priority.LOW,
			'irc-on-create-channel',
		);
		callbacks.add(
			'afterCreateRoom',
			this.onMessageReceived.bind(this, 'local', 'onCreateRoom'),
			callbacks.priority.LOW,
			'irc-on-create-room',
		);
		callbacks.add('afterJoinRoom', this.onMessageReceived.bind(this, 'local', 'onJoinRoom'), callbacks.priority.LOW, 'irc-on-join-room');
		// Leaving rooms or channels
		afterLeaveRoomCallback.add(this.onMessageReceived.bind(this, 'local', 'onLeaveRoom'), callbacks.priority.LOW, 'irc-on-leave-room');
		// Chatting
		callbacks.add(
			'afterSaveMessage',
			this.onMessageReceived.bind(this, 'local', 'onSaveMessage'),
			callbacks.priority.LOW,
			'irc-on-save-message',
		);
		// Leaving
		afterLogoutCleanUpCallback.add(this.onMessageReceived.bind(this, 'local', 'onLogout'), callbacks.priority.LOW, 'irc-on-logout');
	}

	removeLocalHandlers() {
		callbacks.remove('afterValidateLogin', 'irc-on-login');
		callbacks.remove('afterCreateUser', 'irc-on-create-user');
		callbacks.remove('afterCreateChannel', 'irc-on-create-channel');
		callbacks.remove('afterCreateRoom', 'irc-on-create-room');
		callbacks.remove('afterJoinRoom', 'irc-on-join-room');
		afterLeaveRoomCallback.remove('irc-on-leave-room');
		callbacks.remove('afterSaveMessage', 'irc-on-save-message');
		afterLogoutCleanUpCallback.remove('irc-on-logout');
	}

	sendCommand(command, parameters) {
		this.server.emit('onReceiveFromLocal', command, parameters);
	}
}

export default Bridge;
