import { RocketChatFuel } from '../../internals';
import { ContainerBuilder } from '../shared/containers/container.definition';

export class EndToEndTestFactory {
    private containers: Map<string, ContainerBuilder<any, any>> = new Map();

    constructor(private application: RocketChatFuel) {
        if (this.application.hasStarted()) {
            throw new Error('Cannot test an already started application, please provide it without starting it');
        }
    }

    public withContainer(name: string, containerBuilder: ContainerBuilder<any, any>): EndToEndTestFactory {
        if (this.containers.get(name)) {
            throw new Error(`Container ${name} already exists`);
        }

        this.containers.set(name, containerBuilder);
        return this;
    }

    public async start(): Promise<void> {
        await Promise.all(Array.from(this.containers).map(async ([_, container]) => container.start()));

        await this.application.start();
    }
}