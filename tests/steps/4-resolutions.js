/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

describe('resolutions tests', ()=> {
	describe('mobile render', ()=> {
		it('change the resolution', ()=> {
			browser.windowHandleSize({
				width: 650,
				height: 800
			});
		});

		it('should close de sidenav', () => {
			mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
		});

		it('press the navbar button', () => {
			sideNav.sideNavBtn.click();
		});

		it('should open de sidenav', () => {
			browser.pause(1000);
			mainContent.mainContent.getLocation().should.not.deep.equal({x:0, y:0});
		});

		it('open general channel', () => {
			sideNav.openChannel('general');
		});

		it('should close de sidenav', () => {
			browser.pause(1000);
			mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
		});

		it('press the navbar button', () => {
			sideNav.sideNavBtn.click();
		});

		it('opens the user preferences screen', () => {
			sideNav.accountBoxUserName.waitForVisible();
			sideNav.accountBoxUserName.click();
			sideNav.account.waitForVisible();
			sideNav.account.click();
		});

		it('press the preferences link', () => {
			sideNav.preferences.waitForVisible();
			sideNav.preferences.click();
		});

		it('should close de sidenav', () => {
			browser.pause(1000);
			mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
		});

		it('press the navbar button', () => {
			sideNav.sideNavBtn.click();
		});

		it('press the profile link', () => {
			sideNav.profile.waitForVisible();
			sideNav.profile.click();
		});

		it('should close de sidenav', () => {
			browser.pause(1000);
			mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
		});

		it('press the navbar button', () => {
			sideNav.sideNavBtn.click();
		});

		it('press the avatar link', () => {
			sideNav.avatar.waitForVisible();
			sideNav.avatar.click();
		});

		it('should close de sidenav', () => {
			browser.pause(1000);
			mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
		});

		it('press the navbar button', () => {
			sideNav.sideNavBtn.click();
		});

		it('change the resolution', ()=> {
			browser.windowHandleSize({
				width: 1450,
				height: 900
			});
		});

		it('close the preferences menu', () => {
			sideNav.preferencesClose.click();
		});
	});
});