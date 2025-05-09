import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type * as beforeFederationActionModule from '../../../../../../server/services/messages/hooks/BeforeFederationActions';

const isFederationReady = sinon.stub();
const isFederationEnabled = sinon.stub();

const { FederationActions } = proxyquire
	.noCallThru()
	.load<typeof beforeFederationActionModule>('../../../../../../server/services/messages/hooks/BeforeFederationActions', {
		'../../federation/utils': {
			isFederationEnabled,
			isFederationReady,
		},
	});

describe("Don't perform action depending on federation status", () => {
	afterEach(() => {
		isFederationReady.reset();
		isFederationEnabled.reset();
	});

	it('should return true if neither message nor room is federated', () => {
		expect(FederationActions.shouldPerformAction({} as IMessage, {} as IRoom)).to.be.true;
	});

	describe('Federation is enabled', () => {
		it('should return true if message is federated and configuration is valid', () => {
			isFederationEnabled.returns(true);
			isFederationReady.returns(true);

			expect(FederationActions.shouldPerformAction({ federation: { eventId: Date.now().toString() } } as IMessage, {} as unknown as IRoom))
				.to.be.true;
		});

		it('should return true if room is federated and configuration is valid', () => {
			isFederationEnabled.returns(true);
			isFederationReady.returns(true);

			expect(FederationActions.shouldPerformAction({} as unknown as IMessage, { federated: true } as IRoom)).to.be.true;
		});

		it('should return false if message is federated and configuration is invalid', () => {
			isFederationEnabled.returns(true);
			isFederationReady.returns(false);

			expect(FederationActions.shouldPerformAction({ federation: { eventId: Date.now().toString() } } as IMessage, {} as unknown as IRoom))
				.to.be.false;
		});

		it('should return false if room is federated and configuration is invalid', () => {
			isFederationEnabled.returns(true);
			isFederationReady.returns(false);

			expect(FederationActions.shouldPerformAction({} as unknown as IMessage, { federated: true } as IRoom)).to.be.false;
		});
	});

	describe('Federation is disabled', () => {
		it('should return false if room is federated', () => {
			isFederationEnabled.returns(false);
			isFederationReady.returns(false);

			expect(FederationActions.shouldPerformAction({} as unknown as IMessage, { federated: true } as IRoom)).to.be.false;
		});

		it('should return false if message is federated', () => {
			isFederationEnabled.returns(false);
			isFederationReady.returns(false);

			expect(FederationActions.shouldPerformAction({ federation: { eventId: Date.now().toString() } } as IMessage, {} as unknown as IRoom))
				.to.be.false;
		});
	});
});
