import {
  Global,
  Inject,
  Module,
  type OnApplicationShutdown,
  type Provider,
} from '@nestjs/common';
import { type Db, MongoClient } from 'mongodb';
import { SHADOW_CONFIG, type ShadowConfig } from '../config/shadow.config.js';
import { type ModelName, getModelToken, models } from './models.js';
import { TRASH_COLLECTION, registerModels } from './register-models.js';

export const MONGO_CLIENT = Symbol('MONGO_CLIENT');
export const MONGO_DB = Symbol('MONGO_DB');

const modelProviders: Provider[] = (Object.keys(models) as ModelName[]).map(
  (name) => ({
    provide: getModelToken(name),
    inject: [MONGO_DB],
    useFactory: () => models[name],
  }),
);

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      inject: [SHADOW_CONFIG],
      useFactory: (config: ShadowConfig) =>
        new MongoClient(config.mongoUrl).connect(),
    },
    {
      provide: MONGO_DB,
      inject: [MONGO_CLIENT],
      useFactory: (client: MongoClient): Db => {
        const db = client.db();
        registerModels(db, db.collection(TRASH_COLLECTION));
        return db;
      },
    },
    ...modelProviders,
  ],
  exports: [MONGO_DB, ...modelProviders],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.close();
  }
}
