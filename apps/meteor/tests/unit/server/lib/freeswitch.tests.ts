import { expect } from 'chai';
import { describe } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { VoipFreeSwitchService } = proxyquire.noCallThru().load('../../../../ee/server/local-services/voip-freeswitch/service', {
	'../../../../app/settings/server': { get: sinon.stub() },
});

const VoipFreeSwitch = new VoipFreeSwitchService();
// Those tests still need a proper freeswitch environment configured in order to run
// So for now they are being deliberately skipped on CI
describe.skip('VoIP', () => {
	describe('FreeSwitch', () => {
		it('should get a list of users from FreeSwitch', async () => {
			const result = await VoipFreeSwitch.getExtensionList();

			expect(result).to.be.an('array');
			expect(result[0]).to.be.an('object');
			expect(result[0].extension).to.be.a('string');
		});

		it('should get a specific user from FreeSwitch', async () => {
			const result = await VoipFreeSwitch.getExtensionDetails({ extension: '1001' });

			expect(result).to.be.an('object');
			expect(result.extension).to.be.equal('1001');
		});

		it('Should load user domain from FreeSwitch', async () => {
			const result = await VoipFreeSwitch.getDomain();

			expect(result).to.be.a('string').equal('rocket.chat');
		});

		it('Should load user password from FreeSwitch', async () => {
			const result = await VoipFreeSwitch.getUserPassword('1000');

			expect(result).to.be.a('string');
		});
	});
});
