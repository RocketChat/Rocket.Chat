import mock from 'mock-require';
import { expect } from 'chai';
import sinon from 'sinon';

const remove = sinon.stub();

mock('../../../../../../../../../lib/callbacks', {
	callbacks: {
		remove,
	},
});

import { FederationHooks } from '../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/hooks';

describe.only('Federation - Hooks', () => {

	describe('#removeCEValidation()', () => {
		it('should remove the specific validation for CE environments', () => {
            FederationHooks.removeCEValidation();
			expect(remove.calledTwice).to.be.equal(true);
			expect(remove.firstCall.calledWith('federation.beforeAddUserAToRoom', 'federation-v2-can-add-federated-user-to-federated-room')).to.be.equal(true);
			expect(remove.secondCall.calledWith('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce')).to.be.equal(true);
		});
	});
});
