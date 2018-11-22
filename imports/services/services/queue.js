import { sendAllNotifications } from 'meteor/rocketchat:lib';
const USE_REDIS = process.env.EXPERIMENTAL_REDIS;

import { applyMeteor } from '../utils';

function createMemoryQueue() {
	const Queue = require('better-queue');
	return {

		/**
		 * Methods
		 */
		methods: {
			/**
			 * Create a new job
			 *
			 * @param {String} name
			 * @param {any} payload
			 * @returns {Job}
			 */
			createJob(name, payload) {
				return this.getQueue(name).push(payload);
			},

			/**
			 * Get a queue by name
			 *
			 * @param {String} name
			 * @param {Function} cb
			 * @returns {Queue}
			 */
			getQueue(name, cb) {
				if (!this.$queues[name]) {
					this.$queues[name] = new Queue(cb);
				}

				return this.$queues[name];
			},
		},

		/**
		 * Service created lifecycle event handler
		 */
		created() {
			this.$queues = {};
			if (this.schema.queues) {
				Object.entries(this.schema.queues).forEach(([name, fn]) => {
					this.logger.debug(`queue ${ name } created`);
					this.getQueue(name, async(args, cb) => { // TODO remove
						try {
							cb(null, await fn(this, args));
						} catch (error) {
							cb(error);
						}
					});
				});
			}

			return this.Promise.resolve();
		},
	};
}
function createRedisQueue(queueOpts) {

	if (USE_REDIS) { throw 'redis not done yet'; }
	const Kue = require('kue');

	return {

		/**
		 * Methods
		 */
		methods: {
			/**
			 * Create a new job
			 *
			 * @param {String} name
			 * @param {any} payload
			 * @returns {Job}
			 */
			createJob(name, payload) {
				return this.getQueue(name).createJob(payload).save();
			},

			/**
			 * Get a queue by name
			 *
			 * @param {String} name
			 * @returns {Queue}
			 */
			getQueue(name) {
				if (!this.$queues[name]) {
					this.$queues[name] = new Kue(name, queueOpts);
				}

				return this.$queues[name];
			},
		},

		/**
		 * Service created lifecycle event handler
		 */
		created() {
			this.$queues = {};

			if (this.schema.queues) {
				Object.entries(this.schema.queues).forEach(([name, fn]) => {
					this.getQueue(name).process((...args) => fn(this, ...args));
				});
			}

			return this.Promise.resolve();
		},
	};
}

export default {
	version: 1,
	settings: {
		$noVersionPrefix: true,
	},
	name:'notifications',
	mixins: [USE_REDIS ? createRedisQueue() : createMemoryQueue(), applyMeteor(undefined, ['queues'])],
	events: {
		'message.sent': {
			handler(args) {
				return this.createJob('sendNotificationOnMessage', args);
			},
		},
	},
	actions: {
		sendNotificationOnMessage({ params }) {
			this.logger.info('sendNotificationOnMessage');
			return this.createJob('sendNotificationOnMessage', params);
		},
	},
	queues: {
		sendNotificationOnMessage(ctx, { message, room }) {
			sendAllNotifications(message, room);
			ctx.logger.debug(`sendNotificationOnMessage done msg:${ message._id } room: ${ room._id }`);
		},
	},
};
