import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';
import moment from 'moment';
import Queue from 'queue-fifo';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';
import { callbacks } from '../../../../server/lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../server/lib/callbacks/afterLeaveRoomCallback';
import { afterLogoutCleanUpCallback } from '../../../../server/lib/callbacks/afterLogoutCleanUpCallback';
import { updateAuditedBySystem } from '../../../../server/settings/lib/auditedSettingUpdates';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import * as servers from '../servers';
import * as localCommandHandlers from './localHandlers';
import * as peerCommandHandlers from './peerHandlers';

const logger = new Logger('IRC Bridge');
const queueLogger = logger.section('Queue');

type QueueItem = {
	from: string;
	command: string;
	parameters: any[];
};

type BridgeConfig = {
	server: {
		protocol: any;
		[key: string]: any;
	};
	[key: string]: any;
};

type PeerCommand = {
	identifier: string;
	args: any;
};

let removed = false;
const updateLastPing = withThrottling({ wait: 10_000 })(() => {
	if (removed) {
		return;
	}

	void (async () => {
		const updatedValue = await updateAuditedBySystem({
			reason: 'updateLastPing',
		})(Settings.updateValueById, 'IRC_Bridge_Last_Ping', new Date(), { upsert: true });
		if (updatedValue.modifiedCount || updatedValue.upsertedCount) {
			void notifyOnSettingChangedById('IRC_Bridge_Last_Ping');
		}
	})();
});

class Bridge {
	config: BridgeConfig;

	loggedInUsers: string[];

	server: any;

	queue: Queue<QueueItem>;

	queueTimeout: number;

	initTime?: Date;

	constructor(config: BridgeConfig) {
		// General
		this.config = config;

		// Workaround for Rocket.Chat callbacks being called multiple times
		this.loggedInUsers = [];

		// Server
		const Server = (servers as any)[this.config.server.protocol];

		this.server = new Server(this.config);

		this.setupPeerHandlers();
		this.setupLocalHandlers();

		// Command queue
		this.queue = new Queue();
		this.queueTimeout = 5;
	}

	async init(): Promise<void> {
		this.initTime = new Date();
		removed = false;
		this.loggedInUsers = [];

		const lastPing = await Settings.findOneById('IRC_Bridge_Last_Ping');
		if (lastPing) {
			if (Math.abs(moment(lastPing.value as any).diff(moment())) < 1000 * 30) {
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

			void this.runQueue();
		});
	}

	stop(): void {
		this.server.disconnect();
	}

	remove(): void {
		this.log('Removing current connection.');
		removed = true;
		this.server = null;
		this.removeLocalHandlers();
	}

	/**
	 * Log helper
	 */
	log(message: string): void {
		// TODO logger: debug?
		logger.info(message);
	}

	logQueue(message: string | Record<string, any>): void {
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
	onMessageReceived(from: string, command: string, ...parameters: any[]): void {
		this.queue.enqueue({ from, command, parameters });
	}

	async runQueue(): Promise<void> {
		if (!this.server) {
			return;
		}

		const lastResetTime = await Settings.findOneById('IRC_Bridge_Reset_Time');
		if (lastResetTime?.value && lastResetTime.value > this.initTime!) {
			this.stop();
			this.remove();
			return;
		}

		updateLastPing();

		// If it is empty, skip and keep the queue going
		if (this.queue.isEmpty()) {
			setTimeout(this.runQueue.bind(this), this.queueTimeout);
			return;
		}

		// Get the command
		const item = this.queue.dequeue() as QueueItem;

		this.logQueue({ msg: 'Processing command from source', command: item.command, from: item.from });

		// Handle the command accordingly
		try {
			// Handle the command accordingly
			switch (item.from) {
				case 'local':
					if (!(localCommandHandlers as any)[item.command]) {
						throw new Error(`Could not find handler for local:${item.command}`);
					}

					await (localCommandHandlers as any)[item.command].apply(this, item.parameters);
					break;
				case 'peer':
					if (!(peerCommandHandlers as any)[item.command]) {
						throw new Error(`Could not find handler for peer:${item.command}`);
					}

					await (peerCommandHandlers as any)[item.command].apply(this, item.parameters);
					break;
			}
		} catch (e) {
			this.logQueue(e as any);
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
	setupPeerHandlers(): void {
		this.server.on('peerCommand', (cmd: PeerCommand) => {
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
	setupLocalHandlers(): void {
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
			(message: IMessage, { room }: { room: IRoom }) => this.onMessageReceived('local', 'onSaveMessage', message, room),
			callbacks.priority.LOW,
			'irc-on-save-message',
		);
		// Leaving
		afterLogoutCleanUpCallback.add(this.onMessageReceived.bind(this, 'local', 'onLogout'), callbacks.priority.LOW, 'irc-on-logout');
	}

	removeLocalHandlers(): void {
		callbacks.remove('afterValidateLogin', 'irc-on-login');
		callbacks.remove('afterCreateUser', 'irc-on-create-user');
		callbacks.remove('afterCreateChannel', 'irc-on-create-channel');
		callbacks.remove('afterCreateRoom', 'irc-on-create-room');
		callbacks.remove('afterJoinRoom', 'irc-on-join-room');
		afterLeaveRoomCallback.remove('irc-on-leave-room');
		callbacks.remove('afterSaveMessage', 'irc-on-save-message');
		afterLogoutCleanUpCallback.remove('irc-on-logout');
	}

	sendCommand(command: string, parameters: any): void {
		this.server.emit('onReceiveFromLocal', command, parameters);
	}
}

export default Bridge;
