import Redis from "ioredis";

import superjson from "superjson";

const redis = new Redis({
  host: "localhost" as string, // Redis server hostname
  port: 6379, // Redis server port
  // password: 'your_password', // Redis server password (if any)
  db: 0, // Redis database index
  autoResubscribe: true,
  maxRetriesPerRequest: 3,
});
//vrfg
console.log("Running redis startup");

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis error", err);
});

export const publishToRedis = (
  channel: string,
  message: object,
  useSuperJson: boolean = false
) => {
  const msg = useSuperJson
    ? superjson.stringify(message)
    : JSON.stringify(message);
  redis.publish(channel, superjson.stringify(msg));
};
