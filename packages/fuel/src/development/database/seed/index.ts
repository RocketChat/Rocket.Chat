import { DBEntity } from '../../../internals';
import { MongoClient } from 'mongodb';
import { performance } from 'perf_hooks';

export class Seeder {
    private config: {
        databaseUrl: string;
        databaseName: string;
        dropDatabase: boolean;
        removeAllDocuments: boolean;
    } | undefined;
    private documents: Record<string, DBEntity[]> = {};

    public withCollection(collectionName: string, data: DBEntity | DBEntity[]): Seeder {
        if ((Array.isArray(data) && !data.every((item) => item instanceof DBEntity)) && !(data instanceof DBEntity)) {
            throw new Error('You must provide DBEntity(ies) only');
        }
        const documents = this.documents[collectionName] || [];
        this.documents[collectionName] = documents.concat(Array.isArray(data) ? data : [data]);

        return this;
    }

    public withDatabase(config: {
        databaseUrl: string;
        dropDatabase: boolean;
        removeAllDocuments: boolean;
        databaseName: string;
    }): Seeder {
        if (this.config) {
            throw new Error('Seeder is already initialized, cannot override it');
        }
        this.config = config;

        return this;
    }


    public async persist(): Promise<void> {
        if (!this.config) {
            throw new Error('Seeder config is NOT initialized');
        }
        const client = new MongoClient(this.config?.databaseUrl);
        const connection = await client.connect();

        const db = connection.db(this.config.databaseName);
        if (this.config.dropDatabase) {
            await db.dropDatabase();
        }
        const startTime = performance.now();
        let inserted = 0;
        await Promise.all(
            Object.keys(this.documents).map(async (key) => {
                const collection = db.collection(key);
                if (this.config?.removeAllDocuments) {
                    await collection.deleteMany({});
                }
                // TODO: reevaluate this
                // @ts-ignore
                const { insertedCount } = await collection.insertMany(this.documents[key]);
                inserted += insertedCount;
            })
        );

        const duration = (performance.now() - startTime) / 1000;
        console.log(`Finished after ${duration} seconds, inserting ${inserted} rows`);
        process.exit(0)
    }
}
