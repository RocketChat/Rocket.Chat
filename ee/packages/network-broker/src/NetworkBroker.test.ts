import { ServiceClass } from '@rocket.chat/core-services';
import { expect } from 'chai';
import sinon from 'sinon';

import { NetworkBroker } from './NetworkBroker';
import { BrokerMocked } from '../../../../apps/meteor/tests/mocks/server/BrokerMocked';

class DelayedStopBroker extends BrokerMocked {
	async destroyService(name: string) {
		const instance = this.services.get(name);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		await instance.stopped();

		await super.destroyService(name);
	}
}

const broker = new NetworkBroker(new DelayedStopBroker() as any);

describe('NetworkBroker', () => {
	it('should wait services to be fully destroyed', async () => {
		const stoppedStub = sinon.stub();

		const instance = new (class extends ServiceClass {
			name = 'test';

			async stopped() {
				stoppedStub();
			}
		})();

		broker.createService(instance);
		await broker.destroyService(instance);

		expect(stoppedStub.called).to.be.true;
	});
});
