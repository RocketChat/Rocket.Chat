import { before, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { applyAirGappedRestrictionsValidation } from '../../../server/lib/cloud/license/airGappedRestrictionsWrapper';

let restrictionFlag = true;

const airgappedModule = {
	get restricted() {
		return restrictionFlag;
	},
};

before(async () => {
	mock.module('@rocket.chat/license', {
		exports: {
			AirGappedRestriction: airgappedModule,
		},
	});
	mock.module('../../../server/lib/cloud/license/airGappedRestrictionsWrapper', {
		exports: {
			applyAirGappedRestrictionsValidation,
		},
	});
	await import('./airGappedRestrictionsWrapper');
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
