/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import flexTab from '../../pageobjects/flex-tab.page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

//test data imports
import {checkIfUserIsValid} from '../../data/checks';
import {username, email, password} from '../../data/user.js';

describe.only('[User Presence]', function() {

	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});

	it('should always render accountStatusBullet', function() {
		sideNav.accountStatusBullet.isVisible().should.be.true;
	});

	it('should show status as online at first', function() {
		sideNav.accountStatusBullet.isVisible().should.be.true;
		sideNav.accountStatusBulletOnline.isVisible().should.be.true;
	});

	it('should show status as away when not focused on tab', function() {
		const currentTab = browser.getCurrentTabId();
		const temporaryTab = browser.newWindow('http://google.com');

		browser.switchTab(temporaryTab);

		sideNav.accountStatusBullet.isVisible().should.be.true;
		sideNav.accountStatusBulletOnline.isVisible().should.be.false;
		sideNav.accountStatusBulletAway.isVisible().should.be.true;
	});

	it('should show status as online again when focusing on tab');
});
