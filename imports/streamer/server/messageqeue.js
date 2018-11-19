// import { encode, decode } from 'messagepack';

const { STREAMER_TYPE = '' } = process.env;

class Nats {
	constructor() {
		const { STREAMER_HOST = 'localhost', STREAMER_PORT = 32770/* 4222 */ } = process.env;
		try {
			const NATS = require('nats');
			this.client = NATS.connect(`nats://${ STREAMER_HOST }:${ STREAMER_PORT }`);
		} catch (error) {
			throw `${ error } \n try run 'npm i nats'`;
		}
	}
	publish(topic, obj) {
		return this.client.publish(topic, JSON.stringify(obj));
	}

	subscribe(cb) {
		return this.client.subscribe('*', (message, reply, topic) => cb(topic, JSON.parse(message)));
	}
}

class Redis {
	constructor() {
		const { STREAMER_HOST = 'localhost', STREAMER_PORT = 6379 } = process.env;
		try {
			const REDIS = require('redis');
			const config = {
				host: STREAMER_HOST,
				port: STREAMER_PORT,
			};
			this.sub = REDIS.createClient(config);
			this.pub = REDIS.createClient(config);
		} catch (error) {
			throw `${ error } \n try run 'npm i redis'`;
		}
	}

	publish(topic, obj) {
		return this.pub.publish(topic, JSON.stringify(obj));
	}

	subscribe(cb) {
		this.sub.psubscribe('*');
		return this.sub.on('pmessageBuffer', (sub, topic, message) => cb(topic, JSON.parse(message)));
	}
}

export const create = () => {

	if (STREAMER_TYPE.toLocaleLowerCase() === 'nats') {
		return new Nats();
	}

	if (STREAMER_TYPE.toLocaleLowerCase() === 'redis') {
		return new Redis();
	}
};

// export { encode, decode };
