import redis from './redis';
import superjson from 'superjson';
export const redisMessageHandlers: object = {};

redis.on('message', (channel: string, msg: string) => {
  console.log('new message from redis');
  
  const message = superjson.parse(msg);
  const ns = message.ns; 
  return redisMessageHandlers[ns](message);
});
