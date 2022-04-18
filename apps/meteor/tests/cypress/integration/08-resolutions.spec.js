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
			cy.wait(500);
		});

		after(() => {
			Global.setWindowSize(1600, 1600);
			// cy.wait(500);
			sideNav.spotlightSearchIcon.should('be.visible');
		});

		it('it should close the sidenav', () => {
			mainContent.mainContent.should('be.visible').getLocation().its('x').should('be.equal', 0);
			sideNav.sideNavBar.should('not.have.attr', 'data-qa-opened', 'false');
		});

		describe('moving elements:', () => {
			beforeEach(() => {
				sideNav.sideNavBar
					.parent()
					.find('.sidebar')
					.then((el) => {
						if (!el[0].hasAttribute('data-qa-opened')) {
							sideNav.burgerBtn.click({ force: true });
						}
					});

				cy.waitUntil(() => {
					return browser.element('.menu-opened').then((el) => el.length);
				});
			});

			it('it should open the sidenav', () => {
				cy.waitUntil(() => {
					return browser.element('.menu-opened').then((el) => el.length);
				});
				mainContent.mainContent.should('be.visible').getLocation().its('x').should('be.equal', 0);
				sideNav.sideNavBar.should('have.attr', 'data-qa-opened', 'true');
			});

			it('it should not close sidebar on pressing the sidebar item menu', () => {
				sideNav.firstSidebarItemMenu.click({ force: true });
				cy.wait(800);
				mainContent.mainContent.should('be.visible').getLocation().its('x').should('be.equal', 0);
				sideNav.sideNavBar.should('have.attr', 'data-qa-opened', 'true');
				sideNav.firstSidebarItemMenu.click({ force: true });
				cy.wait(800);
			});

			it('it should close the sidenav when open general channel', () => {
				sideNav.openChannel('general');
				cy.wait(1200);
				sideNav.sideNavBar.should('not.have.attr', 'data-qa-opened');
			});

			// Skipped because it's not closing sidebar after opening an item
			describe.skip('Preferences', () => {
				it('it should open the user preferences screen', () => {
					sideNav.sidebarUserMenu.click();
					sideNav.account.click();
				});

				it('it should close the sidenav when press the preferences link', () => {
					sideNav.preferences.click();
					sideNav.sideNavBar.should('not.have.attr', 'data-qa-opened');
				});

				it('it should close the sidenav when press the profile link', () => {
					sideNav.profile.click();
					sideNav.sideNavBar.should('not.have.attr', 'data-qa-opened');
				});

				it('it should close the preferences nav', () => {
					sideNav.preferencesClose.click();
				});
			});
		});
	});
});
