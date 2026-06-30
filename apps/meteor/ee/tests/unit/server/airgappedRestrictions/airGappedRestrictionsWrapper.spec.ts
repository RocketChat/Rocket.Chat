import { expect } from 'chai';
import sinon from 'sinon';
import { describe, it, vi } from 'vitest';

import { applyAirGappedRestrictionsValidation } from '../../../../../app/license/server/airGappedRestrictionsWrapper';

// The patch module (imported below) installs its behaviour onto the real
// `applyAirGappedRestrictionsValidation`. We only need to control `AirGappedRestriction.restricted`,
// so we mock `@rocket.chat/license` with a getter backed by a mutable flag.
let restrictionFlag = true;

vi.mock('@rocket.chat/license', () => ({
	AirGappedRestriction: {
		get restricted() {
			return restrictionFlag;
		},
	},
}));

// Loading the patch file applies the patch to `applyAirGappedRestrictionsValidation` (replaces the
// old `proxyquire.load(...)` whose only purpose was to execute the patch with the license mock).
await import('../../../../server/patches/airGappedRestrictionsWrapper');

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
