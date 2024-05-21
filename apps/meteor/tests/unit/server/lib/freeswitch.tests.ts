import { expect } from 'chai';
import { describe } from 'mocha';

import { VoipFreeSwitchService } from '../../../../server/services/voip-freeswitch/service';

const VoipFreeSwitch = new VoipFreeSwitchService();

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
	});
});
