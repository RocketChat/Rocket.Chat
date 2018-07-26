/* eslint-env mocha */

import { adminEmail, adminPassword } from '../../data/user.js';
import loginPage from '../../pageobjects/login.page';
import sideNav from '../../pageobjects/side-nav.page';
import mainContent from '../../pageobjects/main-content.page';

const users = new Array(10).fill(null)
	.map(() => `${ Date.now() }.${ Math.random().toString(36).slice(2) }`)
	.map((uniqueId, i) => ({
		name: `User #${ uniqueId }`,
		username: `user.test.mentions.${ uniqueId }`,
		email: `user.test.mentions.${ uniqueId }@rocket.chat`,
		password: 'rocket.chat',
		isMentionable: i % 2 === 0
	}));

const registerNewUser = user => browser.executeAsync(({ name, email, username, password, isMentionable }, done) => {
	setTimeout(() => Meteor.call('registerUser', { name, email, pass: password }, error => {
		if (error) {
			throw error;
		}

		setTimeout(() => Meteor.loginWithPassword(email, password, error => {
			if (error) {
				throw error;
			}

			setTimeout(() => Meteor.call('setUsername', username, error => {
				if (error) {
					throw error;
				}

				if (isMentionable) {
					Meteor.call('sendMessage', { rid: 'GENERAL', msg: 'Test' }, error => {
						if (error) {
							throw error;
						}

						Meteor.logout(done);
					});

					return;
				}

				Meteor.logout(done);
			}), 500);
		}), 500);
	}), 500)	;
}, user);

describe('[Message Popup]', () => {
	describe('test user mentions in message popup', () => {
		before(() => {
			loginPage.open();

			users.forEach(registerNewUser);

			loginPage.open();
			loginPage.login({ email: adminEmail, password: adminPassword });

			sideNav.general.waitForVisible(5000);
			sideNav.general.click();
		});

		after(() => {
			browser.execute(() => {
				const user = Meteor.user();
				if (!user) {
					return;
				}
				Meteor.logout(() => {
					RocketChat.callbacks.run('afterLogoutCleanUp', user);
					Meteor.call('logoutCleanUp', user);
					FlowRouter.go('home');
				});
			});
		});

		it('should add "@" to the message input', () => {
			mainContent.addTextToInput('@');
		});

		it('should show the message popup', () => {
			mainContent.messagePopUp.isVisible().should.be.true;
		});

		it('should be that the message popup bar title is people', () => {
			mainContent.messagePopUpTitle.getText().should.be.equal('People');
		});

		it('should show the message popup bar items', ()=> {
			mainContent.messagePopUpItems.isVisible().should.be.true;
		});

		const mentionableUsers = users.filter(({ isMentionable }) => isMentionable);
		for (let i = 1; i <= 5; ++i) {
			it(`should show mentionable user #${ 5 - i + 1 } as message popup bar item #${ i }`, () => {
				mainContent.messagePopUpItems.element(`.popup-item:nth-child(${ i }) strong`)
					.getText().should.be.equal(mentionableUsers[5 - i].username);
			});
		}

		it('should show "all" as message popup bar item #6', () => {
			mainContent.messagePopUpItems.element('.popup-item:nth-child(6) strong')
				.getText().should.be.equal('all');
		});

		it('should show "here" as message popup bar item #7', () => {
			mainContent.messagePopUpItems.element('.popup-item:nth-child(7) strong')
				.getText().should.be.equal('here');
		});
	});
});
