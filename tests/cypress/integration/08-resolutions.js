import Global from '../pageobjects/global';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';


// skipping this since the main content its not moved anymore, instead there is a overlay of the side nav over the main content
describe('[Resolution]', () => {
	describe('[Mobile Render]', () => {
		before(() => {
			checkIfUserIsValid(username, email, password);
		});

		beforeEach(() => {
			Global.setWindowSize(650, 800);
		});

		after(() => {
			Global.setWindowSize(1600, 1600);
			sideNav.spotlightSearchIcon.should('be.visible');
		});

		it('it should close the sidenav', () => {
			mainContent.mainContent.getLocation().its('x').should('be', 0);
			sideNav.sideNavBar.getLocation().its('x').should('not.be', 0);
		});

		describe('moving elements:', () => {
			beforeEach(() => {
				cy.wait(100);
				sideNav.sideNavBar.getLocation().its('x').then((x) => {
					if (x !== 0) {
						sideNav.burgerBtn.click();
					}
				});
				cy.wait(100);
			});

			it('it should open de sidenav', () => {
				mainContent.mainContent.getLocation().its('x').should('be', 0);
				sideNav.sideNavBar.getLocation().its('x').should('be', 0);
			});

			it('it should not close sidebar on pressing the sidebar item menu', () => {
				sideNav.firstSidebarItemMenu.invoke('show');
				sideNav.firstSidebarItemMenu.click();
				mainContent.mainContent.getLocation().its('x').should('be', 0);
				sideNav.sideNavBar.getLocation().its('x').should('be', 0);
				sideNav.popoverOverlay.click();
			});

			it('it should close the sidenav when open general channel', () => {
				sideNav.openChannel('general');
				sideNav.sideNavBar.getLocation().its('x').should('not.be', 0);
			});

			it('it should open the user preferences screen', () => {
				sideNav.sidebarUserMenu.click();
				sideNav.account.click();
			});

			it('it should close the sidenav when press the preferences link', () => {
				sideNav.preferences.click();
				sideNav.sideNavBar.getLocation().its('x').should('not.be', 0);
			});

			it('it should close the sidenav when press the profile link', () => {
				sideNav.profile.click();
				sideNav.sideNavBar.getLocation().its('x').should('not.be', 0);
			});

			it('it should close the preferences nav', () => {
				sideNav.preferencesClose.click();
			});
		});
	});
});
