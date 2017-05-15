/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import Global from '../../pageobjects/global';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

import {username, email, password} from '../../data/user.js';
import {checkIfUserIsValid} from '../../data/checks';

describe('resolutions tests', ()=> {
	describe('mobile render', ()=> {
		before(()=> {
			checkIfUserIsValid(username, email, password);
			sideNav.getChannelFromList('general').waitForExist(5000);
			sideNav.openChannel('general');
			Global.setWindowSize(650, 800);
		});

		after(()=> {
			Global.setWindowSize(1450, 900);
			sideNav.preferencesClose.waitForVisible(5000);
			sideNav.preferencesClose.click();
			sideNav.spotlightSearch.waitForVisible(5000);
		});

		describe('moving elements ', () => {
			it('should close de sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.burgerBtn.click();
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
				sideNav.burgerBtn.click();
			});

			it('opens the user preferences screen', () => {
				sideNav.accountBoxUserName.waitForVisible(5000);
				sideNav.accountBoxUserName.click();
				sideNav.account.waitForVisible(5000);
				sideNav.account.click();
			});

			it('press the preferences link', () => {
				sideNav.preferences.waitForVisible(5000);
				sideNav.preferences.click();
			});

			it('should close de sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.burgerBtn.click();
			});

			it('press the profile link', () => {
				sideNav.profile.waitForVisible(5000);
				sideNav.profile.click();
			});

			it('should close de sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.burgerBtn.click();
			});

			it('press the avatar link', () => {
				sideNav.avatar.waitForVisible(5000);
				sideNav.avatar.click();
			});

			it('should close de sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.equal({x:0, y:0});
			});

			it('press the navbar button', () => {
				sideNav.burgerBtn.click();
			});
		});
	});
});
