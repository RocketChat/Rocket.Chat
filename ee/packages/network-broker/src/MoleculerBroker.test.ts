import { ServiceClass } from '@rocket.chat/core-services';
import { expect } from 'chai';
import sinon from 'sinon';

import { MoleculerBroker } from './MoleculerBroker';
import { BrokerMocked } from '../../../../apps/meteor/tests/mocks/server/BrokerMocked';

class DelayedStopBroker extends BrokerMocked {
	async destroyService(name: string) {
		const instance = this.services.get(name);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		await instance.stopped();

		await super.destroyService(name);
	}
}

const broker = new MoleculerBroker(new DelayedStopBroker() as any);

describe('MoleculerBroker', () => {
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

	it('should emit a balanced event, so one instance of each listening service receives it', async () => {
		const emit = sinon.stub().resolves();
		const balanced = new MoleculerBroker({ emit } as any);

		await balanced.emitToOne('room.user-activity', { rid: 'r1', uid: 'u1', activities: ['user-typing'] });

		expect(emit.calledOnceWith('room.user-activity', [{ rid: 'r1', uid: 'u1', activities: ['user-typing'] }])).to.be.true;
	});
});
