// /* eslint-env mocha */
// /* eslint-disable func-names, prefer-arrow-callback */

// import flexTab from '../../pageobjects/flex-tab.page';
// import mainContent from '../../pageobjects/main-content.page';
// import sideNav from '../../pageobjects/side-nav.page';

// //test data imports
// import {checkIfUserIsValid} from '../../data/checks';
// import {username, email, password} from '../../data/user.js';

// describe.only('[User Presence] @watch', function() {
// 	before(()=>{
// 		checkIfUserIsValid(username, email, password);
// 		sideNav.spotlightSearch.waitForVisible(10000);
// 		sideNav.searchChannel('general');
// 	});

// 	it('should always render accountStatusBullet', function() {
// 		sideNav.accountStatusBullet.isVisible().should.be.true;
// 	});

// 	it('should show status as online at first', function() {
// 		sideNav.accountStatusBullet.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.true;
// 	});

// 	it('should show status as away when not focused on tab', function() {
// 		const currentTab = browser.getCurrentTabId();
// 		const temporaryTab = browser.newWindow('http://google.com');

// 		browser.switchTab(temporaryTab);

// 		sideNav.accountStatusBullet.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.false;
// 		sideNav.accountStatusBulletAway.isVisible().should.be.true;
// 	});

// 	it('should show status as away when not interacting with the window for more than 10 seconds', function() {
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.true;

// 		// 10 seconds without interaction.
// 		sideNav.accountStatusBulletAway.waitForVisible(10000);

// 		sideNav.accountStatusBulletAway.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.false;
// 	});

// 	it('should show status as online after interacting for the first time in a long time', function() {
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.true;

// 		// 10 seconds without interaction.
// 		sideNav.accountStatusBulletAway.waitForVisible(10000);

// 		// expect user to be shown as away
// 		sideNav.accountStatusBulletAway.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.false;

// 		// make interactions
// 		mainContent.sendMessage("This is a interaction");

// 		// expect user to be shown as online again
// 		sideNav.accountStatusBulletAway.isVisible().should.be.false;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.true;
// 	});

// 	it('should show status as online again when focusing on tab', function() {
// 		const appTab = browser.getCurrentTabId();
// 		const temporaryTab = browser.newWindow('http://google.com');

// 		browser.switchTab(temporaryTab);

// 		sideNav.accountStatusBullet.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.false;
// 		sideNav.accountStatusBulletAway.isVisible().should.be.true;

// 		browser.switchTab(appTab);

// 		sideNav.accountStatusBullet.isVisible().should.be.true;
// 		sideNav.accountStatusBulletOnline.isVisible().should.be.true;
// 		sideNav.accountStatusBulletAway.isVisible().should.be.false;
// 	});

// });
