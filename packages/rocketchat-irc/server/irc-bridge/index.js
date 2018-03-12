import _ from 'underscore'
import Queue from 'queue-fifo'

import * as servers from '../servers'
import * as peerCommandHandlers from './peerHandlers'
import * as localCommandHandlers from './localHandlers'

class Bridge {
	constructor(config) {
		// General
		this.config = config

		// Workaround for Rocket.Chat callbacks being called multiple times
		this.loggedInUsers = []

		// Server
		const Server = servers[this.config.server.protocol]

		this.server = new Server(this.config)

		this.setupPeerHandlers()
		this.setupLocalHandlers()

		// Command queue
		this.queue = new Queue()
		this.queueTimeout = 5
	}

	init() {
		this.server.register()

		this.server.on('registered', () => {
			this.logQueue('Starting...')

			this.runQueue()
		})
	}

  /**
   * Log helper
   */
	log(message) {
		console.log(`[irc][bridge] ${message}`)
	}

	logQueue(message) {
		console.log(`[irc][bridge][queue] ${message}`)
	}

	/**
	 *
	 *
	 * Queue
	 *
	 *
	 */
	onMessageReceived(from, command, ...parameters) {
		this.queue.enqueue({ from, command, parameters })
	}

	async runQueue() {
		// If it is empty, skip and keep the queue going
		if(this.queue.isEmpty()) {
			return setTimeout(this.runQueue.bind(this), this.queueTimeout)
		}

		// Get the command
		const item = this.queue.dequeue()

		this.logQueue(`Processing "${item.command}" command from "${item.from}"`)

		// Handle the command accordingly
		switch(item.from) {
			case 'local':
				if (!localCommandHandlers[item.command]) throw new Error(`Could not find handler for local:${item.command}`)

				await localCommandHandlers[item.command].apply(this, item.parameters)
				break
			case 'peer':
				if (!peerCommandHandlers[item.command]) throw new Error(`Could not find handler for peer:${item.command}`)

				await peerCommandHandlers[item.command].apply(this, item.parameters)
				break
		}

		// Keep the queue going
		setTimeout(this.runQueue.bind(this), this.queueTimeout)
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
			this.onMessageReceived('peer', cmd.identifier, cmd.args)
		})
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
		RocketChat.callbacks.add('afterValidateLogin', this.onMessageReceived.bind(this, 'local', 'onLogin'), RocketChat.callbacks.priority.LOW, 'irc-on-login')
		// Joining rooms or channels
		RocketChat.callbacks.add('afterCreateChannel', this.onMessageReceived.bind(this, 'local', 'onCreateRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-create-channel')
		RocketChat.callbacks.add('afterCreateRoom', this.onMessageReceived.bind(this, 'local', 'onCreateRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-create-room')
		RocketChat.callbacks.add('afterJoinRoom', this.onMessageReceived.bind(this, 'local', 'onJoinRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-join-room')
		// Leaving rooms or channels
		RocketChat.callbacks.add('afterLeaveRoom', this.onMessageReceived.bind(this, 'local', 'onLeaveRoom'), RocketChat.callbacks.priority.LOW, 'irc-on-leave-room')
		// Chatting
		RocketChat.callbacks.add('afterSaveMessage', this.onMessageReceived.bind(this, 'local', 'onSaveMessage'), RocketChat.callbacks.priority.LOW, 'irc-on-save-message')
		// Leaving
		RocketChat.callbacks.add('afterLogoutCleanUp', this.onMessageReceived.bind(this, 'local', 'onLogout'), RocketChat.callbacks.priority.LOW, 'irc-on-logout')
	}

	sendCommand(command, parameters) {
		this.server.emit('onReceiveFromLocal', command, parameters)
	}
}

export default Bridge
