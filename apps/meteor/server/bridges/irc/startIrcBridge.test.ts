import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingsGetMock = sandbox.stub();
const initMock = sandbox.stub();
const bridges: Record<'init' | 'stop' | 'remove', sinon.SinonStub>[] = [];
const BridgeMock = sandbox.stub().callsFake(function (this: Record<'init' | 'stop' | 'remove', sinon.SinonStub>) {
	this.init = initMock;
	this.stop = sandbox.stub();
	this.remove = sandbox.stub();
	bridges.push(this);
});

const { startIrcBridge } = p.noCallThru().load('./startIrcBridge', {
	'./irc-bridge': { __esModule: true, default: BridgeMock },
	'../../settings/cached': { settings: { get: settingsGetMock } },
});

const settingValues: Record<string, unknown> = {
	IRC_Protocol: 'RFC2813',
	IRC_Host: 'irc.example.com',
	IRC_Port: 6667,
	IRC_Name: 'irc.rocket.chat',
	IRC_Description: 'Rocket.Chat IRC bridge',
	IRC_Local_Password: 'local-password',
	IRC_Peer_Password: 'peer-password',
};

describe('startIrcBridge', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		initMock.resolves();
		settingsGetMock.callsFake((id: string) => settingValues[id]);
	});

	it('should build the bridge config from the IRC settings', async () => {
		await startIrcBridge();

		expect(BridgeMock.calledOnce).to.be.true;
		expect(BridgeMock.calledWithNew()).to.be.true;
		expect(BridgeMock.firstCall.args[0]).to.deep.equal({
			server: {
				protocol: 'RFC2813',
				host: 'irc.example.com',
				port: 6667,
				name: 'irc.rocket.chat',
				description: 'Rocket.Chat IRC bridge',
			},
			passwords: {
				local: 'local-password',
				peer: 'peer-password',
			},
		});
	});

	it('should wait for the bridge to initialize', async () => {
		let resolveInit: () => void = () => undefined;
		initMock.returns(
			new Promise<void>((resolve) => {
				resolveInit = resolve;
			}),
		);

		let started = false;
		const starting = startIrcBridge().then(() => {
			started = true;
		});

		await new Promise((resolve) => setImmediate(resolve));
		expect(initMock.calledOnce).to.be.true;
		expect(started).to.be.false;

		resolveInit();
		await starting;
		expect(started).to.be.true;
	});

	it('should stop and remove the previous bridge before starting a new one', async () => {
		await startIrcBridge();
		const previous = bridges[bridges.length - 1];

		await startIrcBridge();

		expect(previous.stop.calledOnce).to.be.true;
		expect(previous.remove.calledOnce).to.be.true;
		expect(previous.remove.calledBefore(BridgeMock)).to.be.true;
	});
});
