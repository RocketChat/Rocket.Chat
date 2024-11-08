import { AbstractStartedContainer, GenericContainer } from 'testcontainers';

export abstract class ContainerBuilder<TContainer extends GenericContainer, TStartedContainer extends AbstractStartedContainer> {
    protected startedContainer: TStartedContainer | undefined;

    constructor(protected container: TContainer) {
        this.withDefaultConfigurations();
    }

    protected abstract withDefaultConfigurations(): void;
    public abstract start(): Promise<void>;

    public async restart(): Promise<void> {
        if (!this.startedContainer) {
            throw new Error('MongoDB container is not started yet');
        }
        await this.startedContainer.restart();
    }

    public async stop(): Promise<void> {
        if (!this.startedContainer) {
            throw new Error('MongoDB container is not started yet');
        }
        await this.startedContainer.stop();
    }
}
