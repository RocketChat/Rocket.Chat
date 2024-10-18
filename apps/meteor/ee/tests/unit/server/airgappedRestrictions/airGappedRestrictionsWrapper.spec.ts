import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { applyAirGappedRestrictionsValidation } from '../../../../../app/license/server/airGappedRestrictionsWrapper';

let restrictionFlag = true;

const airgappedModule = {
	get restricted() {
		return restrictionFlag;
	},
};

proxyquire.noCallThru().load('../../../../server/patches/airGappedRestrictionsWrapper.ts', {
	'@rocket.chat/license': {
		AirGappedRestriction: airgappedModule,
	},
	'../../../app/license/server/airGappedRestrictionsWrapper': {
		applyAirGappedRestrictionsValidation,
	},
});

describe('#airGappedRestrictionsWrapper()', () => {
	it('should throw an error when the workspace is restricted', async () => {
		await expect(applyAirGappedRestrictionsValidation(sinon.stub())).to.be.rejectedWith('restricted-workspace');
	});
	it('should NOT throw an error when the workspace is not restricted', async () => {
		restrictionFlag = false;
		const spy = sinon.stub();
		await expect(applyAirGappedRestrictionsValidation(spy)).to.eventually.equal(undefined);
		expect(spy.calledOnce).to.be.true;
	});
});
