import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const pushTokenModelStub = {
	findOneById: sandbox.stub(),
	removeVoipTokensByUserIdAndAuthToken: sandbox.stub(),
};
const registerPushTokenStub = sandbox.stub();

const { PushService } = proxyquire.noCallThru().load('../../../../../server/services/push/service', {
	'@rocket.chat/models': { PushToken: pushTokenModelStub },
	'./tokenManagement/registerPushToken': { registerPushToken: registerPushTokenStub },
	'@rocket.chat/core-services': {
		ServiceClassInternal: class {
			onEvent = (): void => undefined;
		},
	},
});

describe('PushService.registerPushToken()', () => {
	let service: any;

	beforeEach(() => {
		sandbox.reset();
		registerPushTokenStub.resolves('token-id');
		pushTokenModelStub.findOneById.resolves({ _id: 'token-id', tokenType: 'gcm', tokenValue: 'GCM_TOKEN' });
		pushTokenModelStub.removeVoipTokensByUserIdAndAuthToken.resolves({ deletedCount: 0 });
		service = new PushService();
	});

	const input = (overrides: Record<string, unknown> = {}) => ({
		token: { gcm: 'GCM_TOKEN' },
		authToken: 'hashed-auth-token',
		appName: 'app',
		userId: 'user1',
		...overrides,
	});

	it('registers a separate voip document without disturbing the device token', async () => {
		pushTokenModelStub.findOneById.resolves({ _id: 'token-id', tokenType: 'apn', tokenValue: 'APN_TOKEN' });

		const result = await service.registerPushToken(input({ token: { apn: 'APN_TOKEN' }, voipToken: 'VOIP_TOKEN' }));

		expect(registerPushTokenStub.calledTwice).to.be.true;
		expect(registerPushTokenStub.firstCall.args[0]).to.include({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
		expect(registerPushTokenStub.secondCall.args[0]).to.include({ tokenType: 'voip', tokenValue: 'VOIP_TOKEN' });
		expect(pushTokenModelStub.removeVoipTokensByUserIdAndAuthToken.called).to.be.false;

		expect(pushTokenModelStub.findOneById.firstCall.args[0]).to.equal('token-id');
		expect(pushTokenModelStub.findOneById.firstCall.args[1]).to.deep.equal({ projection: { authToken: 0 } });
		expect(result).to.include({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
	});

	it('ignores a voip token sent along a gcm registration', async () => {
		await service.registerPushToken(input({ voipToken: 'VOIP_TOKEN' }));

		expect(registerPushTokenStub.calledOnce).to.be.true;
		expect(registerPushTokenStub.firstCall.args[0]).to.include({ tokenType: 'gcm', tokenValue: 'GCM_TOKEN' });
		expect(pushTokenModelStub.removeVoipTokensByUserIdAndAuthToken.calledOnce).to.be.true;
	});

	it('derives the token type and value from an apn payload', async () => {
		pushTokenModelStub.findOneById.resolves({ _id: 'token-id', tokenType: 'apn', tokenValue: 'APN_TOKEN' });

		const result = await service.registerPushToken(input({ token: { apn: 'APN_TOKEN' } }));

		expect(registerPushTokenStub.calledOnce).to.be.true;
		expect(registerPushTokenStub.firstCall.args[0]).to.include({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
		expect(result).to.include({ tokenType: 'apn', tokenValue: 'APN_TOKEN' });
	});

	it('removes a previously registered voip document when the device re-registers without a voip token', async () => {
		await service.registerPushToken(input());

		expect(registerPushTokenStub.calledOnce).to.be.true;
		expect(pushTokenModelStub.removeVoipTokensByUserIdAndAuthToken.calledOnce).to.be.true;
		expect(pushTokenModelStub.removeVoipTokensByUserIdAndAuthToken.firstCall.args).to.deep.equal(['user1', 'hashed-auth-token']);
	});
});
