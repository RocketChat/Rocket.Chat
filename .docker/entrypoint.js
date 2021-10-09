'use strict';

const {
  MongoClient,
  MongoNetworkError,
  MongoServerSelectionError,
} = require(`/app/bundle/programs/server/npm/node_modules/mongodb`);
const { spawn, exec } = require(`child_process`);

const connectionUri = process.env.MONGO_URL;
const mongoClient = new MongoClient(
  connectionUri,
  { useUnifiedTopology: true },
  { native_parser: true },
  { numberOfRetries: 0 },
  { connectTimeoutMS: 5000 },
  { noDelay: true },
  { serverSelectionTimeoutMS: 5000 },
  { socketTimeoutMS: 5000 },
  { waitQueueTimeoutMS: 5000 }
);

function startRocketChat() {
  const child = spawn(`node`, [`main.js`]);

  child.stdout.on(`data`, (data) => process.stdout.write(data));

  child.stderr.on(`data`, (data) => process.stderr.write(data));

  child.on(`exit`, (code, _) => process.exit(code));
}

async function mongoReady() {
  try {
    await mongoClient.connect();
    // connection successful
    return { ready: true, msg: 'connection established' };
  } catch (err) {
    if (err instanceof MongoNetworkError) {
      return { ready: false, msg: 'mongo server not running' };
    }
    if (err instanceof MongoServerSelectionError) {
      // couldn't connect
      return { ready: false, msg: 'mongo replicaset primary not selected' };
    }
    // some other error unrelated to mongod not running
    // better exit without retrying
    console.error(err);
    process.exit(1);
  }
}

async function start() {
  const sleep = async (seconds) =>
    await new Promise((r) => setTimeout(r, seconds * 1000));

  const maxRetryCount = 30;
	let mongoServerStatus;

  for (let retryCount of Array(maxRetryCount).keys()) {
    mongoServerStatus = await mongoReady();
    if (mongoServerStatus.ready) {
      break;
    }
    retryCount++;
    console.log(mongoServerStatus.msg);
    if (retryCount == maxRetryCount) {
      console.error(
        `max number of retries reached (${maxRetryCount}).. failed to connect.. exiting...`
      );
      process.exit(1);
    }
    console.error(
      `failed to connect to mongod..tried ${retryCount} times.. retrying in 5 seconds...`
    );
    await sleep(5);
  }
  console.log(mongoServerStatus.msg);
  mongoClient.close();
  startRocketChat();
}

async function main() {
  if (process.argv.slice(2).length !== 0) {
    const child = exec(process.argv.slice(2).join(` `));

    child.stdout.on(`data`, (data) => process.stdout.write(data));

    child.stderr.on(`data`, (data) => process.stdout.write(data));

    child.on(`exit`, (code, _) => process.exit(code));

    return;
  }
  await start();
}

main();
