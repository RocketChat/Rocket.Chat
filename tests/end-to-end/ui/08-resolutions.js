import Global from '../../pageobjects/global';
import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';


// skipping this since the main content its not moved anymore, instead there is a overlay of the side nav over the main content
describe('[Resolution]', () => {
	describe('[Mobile Render]', () => {
		before(() => {
			checkIfUserIsValid(username, email, password);
			sideNav.getChannelFromList('general').waitForExist(10000);
			sideNav.openChannel('general');
			Global.setWindowSize(650, 800);
		});

		after(() => {
			Global.setWindowSize(1600, 1600);
			sideNav.spotlightSearchIcon.waitForVisible(10000);
		});

		describe('moving elements:', () => {
			it('it should close the sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.include({ x: 0 });
			});

			it('it should press the navbar button', () => {
				sideNav.burgerBtn.waitForVisible(10000);
				sideNav.burgerBtn.click();
			});

			it('it should open de sidenav', () => {
				mainContent.mainContent.getLocation().should.not.deep.equal({ x: 0 });
			});

			it('it should not close sidebar on pressing the sidebar item menu', () => {
				sideNav.firstSidebarItem.moveToObject();
				sideNav.firstSidebarItemMenu.waitForVisible(10000);
				sideNav.firstSidebarItemMenu.click();
				browser.pause(100);
				mainContent.mainContent.getLocation().should.not.deep.equal({ x: 0 });
				sideNav.popoverOverlay.click();
			});

			it('it should open general channel', () => {
				sideNav.openChannel('general');
			});

			it('it should close the sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.include({ x: 0 });
			});

			it('it should press the navbar button', () => {
				sideNav.burgerBtn.waitForVisible(10000);
				sideNav.burgerBtn.click();
			});

			it('it should open the user preferences screen', () => {
				sideNav.sidebarUserMenu.waitForVisible(10000);
				sideNav.sidebarUserMenu.click();
				sideNav.account.waitForVisible(10000);
				sideNav.account.click();
			});

			it('it should press the preferences link', () => {
				sideNav.preferences.waitForVisible(10000);
				sideNav.preferences.click();
			});

			it('it should close the sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.include({ x: 0 });
			});

			it('it should press the navbar button', () => {
				sideNav.burgerBtn.waitForVisible(10000);
				sideNav.burgerBtn.click();
			});

			it('it should press the profile link', () => {
				sideNav.profile.waitForVisible(10000);
				sideNav.profile.click();
			});

			it('it should close the sidenav', () => {
				mainContent.mainContent.getLocation().should.deep.include({ x: 0 });
			});

			it('it should press the navbar button', () => {
				sideNav.burgerBtn.waitForVisible(10000);
				sideNav.burgerBtn.click();
			});

			it('it should close the preferences nav', () => {
				sideNav.preferencesClose.waitForVisible(10000);
				sideNav.preferencesClose.click();

				sideNav.preferencesClose.waitForVisible(10000, true);
			});
		});
	});
});
