import Redis from 'ioredis';

import { settings } from '../settings/server';
import './settings';

let hasSubbedToAllChannel = false;

// Meteor.startup(() => {
const redis = new Redis({
	host: settings.get('Redis_url') as string, // Redis server hostname
	port: 6379, // Redis server port
	// password: 'your_password', // Redis server password (if any)
	db: 0, // Redis database index
	autoResubscribe: true,
	maxRetriesPerRequest: 3,
});
console.log('Running redis startup');

redis.on('connect', async () => {
	console.log('Connected to Redis');
	try {
		await redis.subscribe('all');
		await redis.subscribe('user-status');
		hasSubbedToAllChannel = true;
	} catch (err) {
		console.log("Couldn't sub to public channels ", err);
	}
});

redis.on('error', (err) => {
	console.error('Redis error', err);
});

export const isRedisHealthy = async () => {
	try {
		return hasSubbedToAllChannel && redis.ping();
	} catch (err) {
		console.error(err);

		return false;
	}
};

export default redis;
