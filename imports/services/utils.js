import { Meteor } from 'meteor/meteor';

export function applyMeteor(original) {
	return function meteorEnvironment(...args) {
		return new Promise(Meteor.bindEnvironment((resolve) => {
			resolve(original(...args));
		}));
	};
}

export function applyMeteorMixin(keys = [], schema = []) {
	return {
		created() {
			function apply(obj, key) {
				Object.keys(obj[key]).forEach((name) => {
					const original = obj[key][name];
					obj[key][name] = applyMeteor(original);
				});
			}
			['actions', ...keys].forEach((name) => apply(this, name));
			schema.forEach((name) => apply(this.schema, name));
		},
	};
}

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
const {
	REDIS_HOST = 'localhost',
	REDIS_PORT = 6379,
	REDIS_PASSWORD,
	QUEUE_UI,
	QUEUE_UI_PORT = 3004,
} = process.env;
function createRedisQueue() {

	const Kue = require('kue');
	const msgpack = require('msgpack5')();
	const jobs = Kue.createQueue({
		prefix: 'q',
		redis: {
			return_buffers: true,
			port: REDIS_PORT,
			host: REDIS_HOST,
			auth: REDIS_PASSWORD,
			// db: 3, // if provided select a non-default redis db
			// options: {
			// 	// see https://github.com/mranney/node_redis#rediscreateclient
			// },
		},
	});

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
				return this.getQueue(name).create(msgpack.encode(payload)).save();
			},

			/**
			 * Get a queue by name
			 *
			 * @param {String} name
			 * @returns {Queue}
			 */
			getQueue(name) {
				if (!this.$queues[name]) {
					this.$queues[name] = jobs;
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
					this.getQueue(name).process(name, async(payload, done) => {
						try {
							await fn(msgpack.encode(payload));
							done();
						} catch (error) {
							done(error);
						}
					});
				});
			}
			if (QUEUE_UI) {
				Kue.app.listen(QUEUE_UI_PORT);
			}
			return this.Promise.resolve();
		},
	};
}

const USE_REDIS = process.env.EXPERIMENTAL_REDIS_QUEUES;
export const queues = () => (USE_REDIS ? createRedisQueue() : createMemoryQueue());
