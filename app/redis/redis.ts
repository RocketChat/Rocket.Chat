import Redis from 'ioredis';

import { settings } from '../settings/server';
import './settings';

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

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Redis error', err);
});
// });

export const isRedisHealthy = async () => {
  try {
    return redis.ping();
  } catch (err) {
    console.error(err);

    return false;
  }
};

export default redis;
