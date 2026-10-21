import { ServiceClass } from '@rocket.chat/core-services';
import { expect } from 'chai';
import sinon from 'sinon';

import { MoleculerBroker } from './MoleculerBroker';

type ServiceSchema = { name: string; stopped: () => Promise<void> };

class DelayedStopBroker {
	services = new Map<string, ServiceSchema>();

	createService(schema: ServiceSchema) {
		this.services.set(schema.name, schema);
	}

	async destroyService(name: string) {
		await new Promise((resolve) => setTimeout(resolve, 1000));

		await this.services.get(name)?.stopped();

		this.services.delete(name);
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
