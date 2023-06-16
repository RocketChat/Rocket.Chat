import { expect } from 'chai';
import sinon from 'sinon';

import { NetworkBroker } from '../../../server/NetworkBroker';

describe('NetworkBroker', () => {
	const serviceBrokerMock: any = {
		destroyService: sinon.stub(),
		createService: sinon.stub(),
		getLocalService: sinon.stub(),
	};

	afterEach(() => {
		sinon.restore();
	});

	describe('#destroyService()', () => {
		const broker = new NetworkBroker(serviceBrokerMock);
		const stoppedMock = sinon.stub();

		it('should NOT destroy the service if it does not have a name', async () => {
			await broker.destroyService({ getName: () => '' } as any);

			expect(serviceBrokerMock.destroyService.called).to.be.false;
			expect(stoppedMock.called).to.be.false;
		});
		it('should NOT destroy the service if it does NOT exist', async () => {
			serviceBrokerMock.getLocalService.returns(undefined);
			await broker.destroyService({ getName: () => 'name' } as any);

			expect(serviceBrokerMock.destroyService.called).to.be.false;
			expect(stoppedMock.called).to.be.false;
		});
		it('should destroy the service if it exists', async () => {
			const instance = { getName: () => 'name', stopped: stoppedMock } as any;
			serviceBrokerMock.getLocalService.returns({});
			await broker.destroyService(instance);

			expect(serviceBrokerMock.destroyService.calledWith('name')).to.be.true;
			expect(stoppedMock.called).to.be.true;
		});
	});

	describe('#createService()', () => {
		const broker = new NetworkBroker(serviceBrokerMock);
		const createdMock = sinon.stub();

		it('should NOT create the service if it does not have a name', () => {
			broker.createService({ getName: () => '' } as any);

			expect(serviceBrokerMock.createService.called).to.be.false;
			expect(createdMock.called).to.be.false;
		});
		it('should NOT create the service if it already exists', () => {
			serviceBrokerMock.getLocalService.returns({});
			broker.createService({ getName: () => 'name', getEvents: () => [], isInternal: () => false } as any);

			expect(serviceBrokerMock.createService.called).to.be.false;
			expect(createdMock.called).to.be.false;
		});
		it('should create the service if it does NOT exists yet', () => {
			const instance = { getName: () => 'name', created: createdMock, getEvents: () => [], isInternal: () => false } as any;
			serviceBrokerMock.getLocalService.returns(undefined);
			broker.createService(instance);

			expect(serviceBrokerMock.createService.called).to.be.true;
			expect(createdMock.called).to.be.true;
		});
	});
});
