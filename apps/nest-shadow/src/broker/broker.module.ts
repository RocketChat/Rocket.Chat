import {
  Global,
  Inject,
  Module,
  type OnApplicationBootstrap,
  type Provider,
} from '@nestjs/common';
import { type IBroker, api } from '@rocket.chat/core-services';
import { startBroker } from '@rocket.chat/network-broker';
import {
  type CoreServiceName,
  coreServices,
  getCoreServiceToken,
} from './core-services.js';

export const BROKER = Symbol('BROKER');

const coreServiceProviders: Provider[] = (
  Object.keys(coreServices) as CoreServiceName[]
).map((name) => ({
  provide: getCoreServiceToken(name),
  inject: [BROKER],
  useFactory: () => coreServices[name],
}));

@Global()
@Module({
  providers: [
    {
      provide: BROKER,
      useFactory: (): IBroker => {
        const broker = startBroker();
        api.setBroker(broker);
        return broker;
      },
    },
    ...coreServiceProviders,
  ],
  exports: [BROKER, ...coreServiceProviders],
})
export class BrokerModule implements OnApplicationBootstrap {
  constructor(@Inject(BROKER) private readonly broker: IBroker) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.broker.start();
  }
}
