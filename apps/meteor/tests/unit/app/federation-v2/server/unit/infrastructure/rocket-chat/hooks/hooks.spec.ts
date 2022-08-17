// /* eslint-disable */
// import proxyquire from 'proxyquire';
// import { expect } from 'chai';
// import sinon from 'sinon';

// const remove = sinon.stub();
// proxyquire.noCallThru().load('../../../../../../../../../lib/callbacks', {
// 	'meteor/meteor': {},
// 	'meteor/random': {},
// 	callbacks: {
// 		remove,
// 	},
// });

// import { FederationHooks } from '../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/hooks';

// describe('Federation - Infrastructure - RocketChat - Hooks', () => {
// 	describe('#removeCEValidation()', () => {
// 		it('should remove the specific validation for CE environments', () => {
// 			FederationHooks.removeCEValidation();
// 			expect(remove.calledTwice).to.be.equal(true);
// 			expect(
// 				remove.firstCall.calledWith('federation.beforeAddUserAToRoom', 'federation-v2-can-add-federated-user-to-federated-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.secondCall.calledWith('federation.beforeCreateDirectMessage', 'federation-v2-can-create-direct-message-from-ui-ce'),
// 			).to.be.equal(true);
// 		});
// 	});
// });
