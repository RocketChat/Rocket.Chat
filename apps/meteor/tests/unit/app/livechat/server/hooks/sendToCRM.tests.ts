import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const resultObj = {
	result: true,
};

const { sendMessageType, isOmnichannelNavigationMessage, isOmnichannelClosingMessage, getAdditionalFieldsByType } = p
	.noCallThru()
	.load('../../../../../../app/livechat/server/hooks/sendToCRM', {
		'../../../settings/server': {
			settings: {
				get() {
					return resultObj.result;
				},
			},
		},
		'../../../utils/server/functions/normalizeMessageFileUpload': {
			normalizeMessageFileUpload: sinon.stub().returnsArg(0),
		},
		'../lib/webhooks': {},
		'../lib/guests': { getLivechatRoomGuestInfo: sinon.stub() },
	});

describe('[OC] Send TO CRM', () => {
	describe('isOmnichannelNavigationMessage', () => {
		it('should return true if the message is a navigation message', () => {
			const message = { t: 'livechat_navigation_history' } as any;
			expect(isOmnichannelNavigationMessage(message)).to.be.true;
		});

		it('should return false if the message is not a navigation message', () => {
			const message = { t: 'livechat-close' } as any;
			expect(isOmnichannelNavigationMessage(message)).to.be.false;
		});
	});

	describe('isOmnichannelClosingMessage', () => {
		it('should return true if the message is a closing message', () => {
			const message = { t: 'livechat-close' } as any;
			expect(isOmnichannelClosingMessage(message)).to.be.true;
		});

		it('should return false if the message is not a closing message', () => {
			const message = { t: 'livechat_navigation_history' } as any;
			expect(isOmnichannelClosingMessage(message)).to.be.false;
		});
	});

	describe('sendMessageType', () => {
		it('should return true if the message type is a closing message', () => {
			expect(sendMessageType('livechat-close')).to.be.true;
		});

		it('should return true if the message type is a navigation message and the settings are enabled', () => {
			expect(sendMessageType('livechat_navigation_history')).to.be.true;
		});

		it('should return false if the message type is a navigation message and the settings are disabled', () => {
			resultObj.result = false;
			expect(sendMessageType('livechat_navigation_history')).to.be.false;
		});

		it('should return false if the message type is not a closing or navigation message', () => {
			expect(sendMessageType('message')).to.be.false;
		});
	});

	describe('getAdditionalFieldsByType', () => {
		it('should return the correct fields for the LivechatSessionStart type', () => {
			const room = { departmentId: 'departmentId' } as any;
			expect(getAdditionalFieldsByType('LivechatSessionStart', room)).to.deep.equal({ departmentId: 'departmentId' });
		});

		it('should return the correct fields for the LivechatSessionQueued type', () => {
			const room = { departmentId: 'departmentId' } as any;
			expect(getAdditionalFieldsByType('LivechatSessionQueued', room)).to.deep.equal({ departmentId: 'departmentId' });
		});

		it('should return the correct fields for the LivechatSession type', () => {
			const room = {
				departmentId: 'departmentId',
				servedBy: 'servedBy',
				closedAt: 'closedAt',
				closedBy: 'closedBy',
				closer: 'closer',
			} as any;
			expect(getAdditionalFieldsByType('LivechatSession', room)).to.deep.equal({
				departmentId: 'departmentId',
				servedBy: 'servedBy',
				closedAt: 'closedAt',
				closedBy: 'closedBy',
				closer: 'closer',
			});
		});

		it('should return the correct fields for the LivechatSessionTaken type', () => {
			const room = { departmentId: 'departmentId', servedBy: 'servedBy' } as any;
			expect(getAdditionalFieldsByType('LivechatSessionTaken', room)).to.deep.equal({ departmentId: 'departmentId', servedBy: 'servedBy' });
		});

		it('should return the correct fields for the LivechatSessionForwarded type', () => {
			const room = {
				departmentId: 'departmentId',
				servedBy: 'servedBy',
				oldDepartmentId: 'oldDepartmentId',
				oldServedBy: 'oldServedBy',
			} as any;
			expect(getAdditionalFieldsByType('LivechatSessionForwarded', room)).to.deep.equal({
				departmentId: 'departmentId',
				servedBy: 'servedBy',
				oldDepartmentId: 'oldDepartmentId',
				oldServedBy: 'oldServedBy',
			});
		});

		it('should return an empty object for an unknown type', () => {
			const room = {} as any;
			expect(getAdditionalFieldsByType('unknownType' as any, room)).to.deep.equal({});
		});
	});
});
