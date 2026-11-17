import { describe, it } from 'node:test';

import { expect } from 'chai';

import { isOutlookAddInPath } from './outlookAddInPaths';

describe('isOutlookAddInPath', () => {
	it('should only match paths under the add-in folder', () => {
		expect(isOutlookAddInPath('/outlook-addin/taskpane.html')).to.be.true;
		expect(isOutlookAddInPath('/outlook-addin-evil/page.html')).to.be.false;
		expect(isOutlookAddInPath('/home')).to.be.false;
	});
});
