import { MongoMemoryServer } from 'mongodb-memory-server';

// A MongoDB for one e2e run. NEST_SHADOW_E2E_MONGO_URL points the run at an
// existing server instead, where the memory server cannot download mongod.
export async function startMongo(): Promise<{
  uri: string;
  stop: () => Promise<void>;
}> {
  const dbName = `nest_shadow_e2e_${Date.now()}`;
  const external = process.env.NEST_SHADOW_E2E_MONGO_URL;

  if (external) {
    const url = new URL(external);
    url.pathname = `/${dbName}`;
    return { uri: url.toString(), stop: async () => undefined };
  }

  const server = await MongoMemoryServer.create();
  return {
    uri: server.getUri(dbName),
    stop: async () => {
      await server.stop();
    },
  };
}
