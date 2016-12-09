/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

import {username, email, password} from '../test-data/user.js';
import {checkIfUserIsValid} from '../test-data/checks';

describe.skip('resolutions tests', ()=> {
	describe('mobile render', ()=> {
		before(()=> {
			browser.pause(1000);
			checkIfUserIsValid(username, email, password);
			sideNav.getChannelFromList('general').waitForExist(5000);
			sideNav.openChannel('general');
			browser.windowHandleSize({
				width: 650,
				height: 800
			});
		});

		after(()=> {
			browser.windowHandleSize({
				width: 1450,
				height: 900
			});
		});

		describe('moving elements ', () => {
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
				browser.pause(500);
			});

			it('opens the user preferences screen', () => {
				sideNav.accountBoxUserName.waitForVisible();
				sideNav.accountBoxUserName.click();
				browser.pause(500);
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

			it('close the preferences menu', () => {
				browser.pause(500);
				sideNav.preferencesClose.click();
			});
		});
	});
});