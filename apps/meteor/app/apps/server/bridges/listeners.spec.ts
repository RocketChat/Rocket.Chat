import { AppInterface } from '@rocket.chat/apps-engine/definition/metadata';
import { expect } from 'chai';
import sinon from 'sinon';

import { AppListenerBridge } from './listeners';

describe('AppListenerBridge', () => {
	let bridge: AppListenerBridge;
	let listenerManager: { hasListeners: sinon.SinonStub; executeListener: sinon.SinonStub };
	let messageConverter: { convertMessage: sinon.SinonStub; convertToApp: sinon.SinonStub; convertAppMessage: sinon.SinonStub };
	let orch: any;

	beforeEach(() => {
		listenerManager = {
			hasListeners: sinon.stub(),
			executeListener: sinon.stub(),
		};

		messageConverter = {
			convertMessage: sinon.stub().resolves({ id: 'converted-msg' }),
			convertToApp: sinon.stub().returns({}),
			convertAppMessage: sinon.stub().resolves({ _id: 'final-msg' }),
		};

		orch = {
			getManager: sinon.stub().returns({
				getListenerManager: sinon.stub().returns(listenerManager),
			}),
			getConverters: sinon.stub().returns({
				get: sinon.stub().returns(messageConverter),
			}),
		};

		bridge = new AppListenerBridge(orch);
	});

	afterEach(() => {
		sinon.restore();
	});

	describe('handleEvent', () => {
		it('should return undefined and skip conversion when there are no listeners', async () => {
			listenerManager.hasListeners.returns(false);

			const result = await bridge.handleEvent({
				event: AppInterface.IPostMessageSent,
				payload: [{ _id: 'msg-id', rid: 'room-id', msg: 'hello' } as any],
			} as any);

			expect(result).to.be.undefined;
			expect(messageConverter.convertMessage.called).to.be.false;
		});

		it('should proceed to conversion and execution when there are listeners', async () => {
			listenerManager.hasListeners.returns(true);
			listenerManager.executeListener.resolves(undefined);

			await bridge.handleEvent({
				event: AppInterface.IPostMessageSent,
				payload: [{ _id: 'msg-id', rid: 'room-id', msg: 'hello' } as any],
			} as any);

			expect(messageConverter.convertMessage.calledOnce).to.be.true;
		});
	});
});
