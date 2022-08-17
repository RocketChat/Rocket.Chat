// /* eslint-disable */
// import proxyquire from 'proxyquire';
// import { expect } from 'chai';
// import sinon from 'sinon';

// const remove = sinon.stub();
// proxyquire.noCallThru().load('../../../../../../../../../lib/callbacks', {
// 	'meteor/meteor': {},
// 	'meteor/random': {
// 		Random: {
// 			id: () => 1,
// 		},
// 	},
// 	callbacks: {
// 		remove,
// 	},
// });

// import { FederationHooksEE } from '../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/hooks';

// describe.only('FederationEE - Infrastructure - RocketChat - Hooks', () => {
// 	describe('#removeAll()', () => {
// 		it('should remove the specific validation for EE environments', () => {
// 			FederationHooksEE.removeAll();
// 			expect(remove.callCount).to.be.equal(7);
// 			expect(
// 				remove.getCall(0).calledWith('beforeCreateDirectRoom', 'federation-v2-before-create-direct-message-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(1).calledWith('afterCreateDirectRoom', 'federation-v2-after-create-direct-message-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(2).calledWith('afterAddedToRoom', 'federation-v2-after-add-users-to-a-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(3).calledWith('federation.afterCreateFederatedRoom', 'federation-v2-after-create-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(4).calledWith('federation.beforeAddUserAToRoom', 'federation-v2-before-add-user-to-the-room'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(5).calledWith('afterRoomNameChange', 'federation-v2-after-room-name-changed'),
// 			).to.be.equal(true);
// 			expect(
// 				remove.getCall(6).calledWith('afterRoomTopicChange', 'federation-v2-after-room-topic-changed'),
// 			).to.be.equal(true);
// 		});
// 	});
// });
