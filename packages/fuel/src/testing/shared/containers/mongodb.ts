import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ContainerBuilder } from './container.definition';

// This is necessary due to the reusing strategy
export async function keepTryingToStartContainer<T>(fn: () => Promise<T>): Promise<T> {
    do {
        try {
            return await fn();
        } catch (e: any) {
            if (!e.message.includes('port is already allocated')) {
                throw e;
            }
        }
    } while (true);
}

export class MongoDBContainerBuilder extends ContainerBuilder<MongoDBContainer, StartedMongoDBContainer> {

    constructor({ image, exposedPort }: { image: string; exposedPort: number }) {
        super(new MongoDBContainer(image));
        this.container.withExposedPorts({
            container: 27017,
            host: exposedPort,
        })
    }

    protected withDefaultConfigurations(): void {
        this.container
            .withTmpFs({ '/data/db': 'rw' })
            .withReuse();
    }

    public async start(): Promise<void> {
        if (this.startedContainer) {
            throw new Error('MongoDB container already started');
        }
        this.startedContainer = await keepTryingToStartContainer<StartedMongoDBContainer>(async () => {
            return await this.container.start();
        });
    }

    public getConnectionString(): string {
        if (!this.startedContainer) {
            throw new Error('MongoDB container is not started yet');
        }
        return this.startedContainer.getConnectionString();
    }

}
