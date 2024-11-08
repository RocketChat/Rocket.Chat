import { NatsContainer, StartedNatsContainer } from '@testcontainers/nats';
import { ContainerBuilder } from './container.definition';

export class NatsContainerBuilder extends ContainerBuilder<NatsContainer, StartedNatsContainer> {

    constructor({ image, exposedPort }: { image: string; exposedPort: number }) {
        super(new NatsContainer(image));
        this.container.withExposedPorts({
            container: 4222,
            host: exposedPort,
        })
    }

    protected withDefaultConfigurations(): void {
        this.container
            .withReuse()
    }

    public async start(): Promise<void> {
        if (this.startedContainer) {
            throw new Error('Nats container already started');
        }
        this.startedContainer = await this.container.start();
    }

    public getConnectionOptions(): Record<string, any> {
        if (!this.startedContainer) {
            throw new Error('Nats container is not started yet');
        }
        return this.startedContainer.getConnectionOptions();
    }

}
