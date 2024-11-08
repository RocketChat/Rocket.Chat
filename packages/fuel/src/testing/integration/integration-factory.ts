import { TestBed, UnitTestBed } from '@suites/unit';
import { FUEL_DI_TOKENS, IInternalEphemeralMessagingRegistrar, IInternalRPCAdapter, IInternalRPCClient, InMemoryExternalModuleConsumer, RemoteExternalModuleConsumer, RocketChatFuel } from '../../internals';
import { SolitaryUnitTestDependencyAdapter } from '../shared/dependency-adapter';
import { ContainerBuilder } from '../shared/containers/container.definition';

export class IntegrationTestApplication extends RocketChatFuel {

    public registerDependency(token: string, constructor: RemoteExternalModuleConsumer | InMemoryExternalModuleConsumer): void {
        this.dependencyContainer.unregister(token);
        this.dependencyContainer.registerValue(token, constructor);
    }

    public getRPCClient(): IInternalRPCClient {
        return this.dependencyContainer.resolveByToken<IInternalRPCClient>(FUEL_DI_TOKENS.INTERNAL_RPC_CLIENT);
    }

    public getRPCAdapter(): IInternalRPCAdapter {
        return this.dependencyContainer.resolveByToken<IInternalRPCAdapter>(FUEL_DI_TOKENS.INTERNAL_RPC_ADAPTER);
    }

    // public getEphemeralMessageClient(): IInternalEphemeralMessagingClient {
    //     return this.dependencyContainer.resolveByToken<IInternalEphemeralMessagingClient>(FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_CLIENT);
    // }

    public getEphemeralMessagingRegistrar(): IInternalEphemeralMessagingRegistrar {
        return this.dependencyContainer.resolveByToken<IInternalEphemeralMessagingRegistrar>(FUEL_DI_TOKENS.INTERNAL_EPHEMERAL_MESSAGING_REGISTRAR);
    }
}

export class IntegrationTestFactory {
    private dependencies: Map<string, SolitaryUnitTestDependencyAdapter> = new Map();
    private dependenciesToResolve: Map<string, Promise<UnitTestBed<RemoteExternalModuleConsumer | InMemoryExternalModuleConsumer>>> = new Map();
    private containers: Map<string, ContainerBuilder<any, any>> = new Map();

    constructor(private application: IntegrationTestApplication) {
        if (this.application.hasStarted()) {
            throw new Error('Cannot test an already started application, please provide it without starting it');
        }
    }

    public mockExternalRemoteModuleDependency(token: string, target: new (...args: any[]) => RemoteExternalModuleConsumer): IntegrationTestFactory {
        if (this.dependenciesToResolve.has(token)) {
            throw new Error(`Cannot mock ${token} multiple times`);
        }
        this.dependenciesToResolve.set(token, TestBed.solitary(target).compile());

        return this;
    }

    public mockExternalInMemoryModuleDependency(token: string, target: new (...args: any[]) => InMemoryExternalModuleConsumer): IntegrationTestFactory {
        if (this.dependenciesToResolve.has(token)) {
            throw new Error(`Cannot mock ${token} multiple times`);
        }
        this.dependenciesToResolve.set(token, TestBed.solitary(target).compile());

        return this;
    }

    public withContainer(name: string, containerBuilder: ContainerBuilder<any, any>): IntegrationTestFactory {
        if (this.containers.get(name)) {
            throw new Error(`Container ${name} already exists`);
        }

        this.containers.set(name, containerBuilder);
        return this;
    }

    public async start(): Promise<void> {
        await Promise.all(Array.from(this.dependenciesToResolve).map(async ([token, promise]) => {
            const { unit: instance, unitRef } = await promise;
            this.application.registerDependency(token, instance);
            this.dependencies.set(token, new SolitaryUnitTestDependencyAdapter(unitRef));
        }));

        await Promise.all(Array.from(this.containers).map(async ([_, container]) => container.start()));

        await this.application.start();
    }

    public async stop(): Promise<void> {
        await Promise.all(Array.from(this.containers).map(async ([_, container]) => container.stop()));
    }

    public getDependencyAdapter(token: string): SolitaryUnitTestDependencyAdapter {
        const adapter = this.dependencies.get(token);
        if (!adapter) {
            throw new Error(`Could not find ${token} dependency`);
        }

        return adapter;
    }

    public getRPCClient(): IInternalRPCClient {
        if (!this.application.hasStarted()) {
            throw new Error('Cannot retrieve a rpc client instance for a non-started application');
        }
        return this.application.getRPCClient();
    }

    public getEphemeralMessagingRegistrar(): IInternalEphemeralMessagingRegistrar {
        if (!this.application.hasStarted()) {
            throw new Error('Cannot retrieve a ephemeral messaging registrar instance for a non-started application');
        }
        return this.application.getEphemeralMessagingRegistrar();
    }

    public getRPCAdapter(): IInternalRPCAdapter {
        if (!this.application.hasStarted()) {
            throw new Error('Cannot retrieve a rpc adapter instance for a non-started application');
        }
        return this.application.getRPCAdapter();
    }

    // TODO: it's not possible to send events internally to the service, we need to create a client without using the internal service
    // public getEphemeralMessagingClient(): IInternalEphemeralMessagingClient {
    //     if (!this.application.hasStarted()) {
    //         throw new Error('Cannot retrieve a ephemeral messaging client instance for a non-started application');
    //     }
    //     return this.application.getEphemeralMessageClient();
    // }
}