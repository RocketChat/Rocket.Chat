/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import page from '../../pageobjects/Page';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

import {username, email, password} from '../../data/user.js';
import {checkIfUserIsValid} from '../../data/checks';

describe.skip('resolutions tests', ()=> {
	describe('mobile render', ()=> {
		before(()=> {
			checkIfUserIsValid(username, email, password);
			sideNav.getChannelFromList('general').waitForExist(5000);
			sideNav.openChannel('general');
			page.setWindowSize(650, 800);
		});

		after(()=> {
			page.setWindowSize(1450, 900);
		});

		describe('moving elements ', () => {
			it('should close de sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.sideNavBtn.click();
			});

			it('should open de sidenav', () => {
				mainContent.mainContent.getLocation().should.not.deep.equal({x:0, y:0});
			});

			it('open general channel', () => {
				sideNav.openChannel('general');
			});

			it('should close de sidenav', () => {
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
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.sideNavBtn.click();
			});

			it('close the preferences menu', () => {
				sideNav.preferencesClose.click();
			});
		});
	});
});
