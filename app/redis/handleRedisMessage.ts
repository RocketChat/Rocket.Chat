import redis from "./redis";
import superjson from 'superjson';
export const redisMessageHandlers: object = {};

redis.on('message', (channel: string, msg: string) => {
    const message = superjson.parse(msg);
    const ns = message.ns; 
    ///sf
   // redisMessageHandlers.ns(message)
   return redisMessageHandlers['rocketchat_message'](message);
})