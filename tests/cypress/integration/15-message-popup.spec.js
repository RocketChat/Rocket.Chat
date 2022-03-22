import { adminEmail, adminPassword } from '../../data/user.js';
import { api, request, getCredentials, credentials } from '../../data/api-data.js';
import loginPage from '../pageobjects/login.page';
import sideNav from '../pageobjects/side-nav.page';
import mainContent from '../pageobjects/main-content.page';

const users = new Array(10)
	.fill(null)
	.map(() => `${Date.now()}.${Math.random().toString(36).slice(2)}`)
	.map((uniqueId, i) => ({
		name: `User #${uniqueId}`,
		username: `user.test.mentions.${uniqueId}`,
		email: `user.test.mentions.${uniqueId}@rocket.chat`,
		password: 'rocket.chat',
		isMentionable: i % 2 === 0,
	}));

const createTestUser = async ({ email, name, username, password, isMentionable }) => {
	await new Promise((done) => getCredentials(done));

	await new Promise((done) =>
		request
			.post(api('users.create'))
			.set(credentials)
			.send({
				email,
				name,
				username,
				password,
				active: true,
				roles: ['user'],
				joinDefaultChannels: true,
				verified: true,
			})
			.end(done),
	);

	if (isMentionable) {
		const userCredentials = {};

		await new Promise((done) =>
			request
				.post(api('login'))
				.send({ user: username, password })
				.expect((res) => {
					userCredentials['X-Auth-Token'] = res.body.data.authToken;
					userCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done),
		);

		await new Promise((done) =>
			request
				.post(api('chat.postMessage'))
				.set(userCredentials)
				.send({
					channel: 'general',
					text: 'Test',
				})
				.end(done),
		);
	}
};

describe('[Message Popup]', () => {
	before(() => {
		loginPage.open();

		cy.logout();

		cy.window().then({ timeout: 10000 }, async () => {
			for (const user of users) {
				await createTestUser(user); // eslint-disable-line no-await-in-loop
			}
		});

		// loginPage.open();
		loginPage.login({ email: adminEmail, password: adminPassword });

		sideNav.general.click();
	});

	after(() => {
		cy.logout();
	});

	describe('test user mentions in message popup', () => {
		it('should add "@" to the message input', () => {
			mainContent.setTextToInput('@');
		});

		it('should show the message popup', () => {
			mainContent.messagePopUp.should('be.visible');
		});

		it('should be that the message popup bar title is people', () => {
			mainContent.messagePopUpTitle.should('contain', 'People');
		});

		it('should show the message popup bar items', () => {
			mainContent.messagePopUpItems.should('be.visible');
		});

		const mentionableUsers = users.filter(({ isMentionable }) => isMentionable);
		for (let i = 1; i <= 5; ++i) {
			it(`should show mentionable user #${5 - i + 1} as message popup bar item #${i}`, () => {
				mainContent.messagePopUpItems.find(`.popup-item:nth-child(${i}) strong`).should('contain', mentionableUsers[5 - i].username);
			});
		}

		it('should show "all" as message popup bar item #6', () => {
			mainContent.messagePopUpItems.find('.popup-item:nth-child(6) strong').should('contain', 'all');
		});

		it('should show "here" as message popup bar item #7', () => {
			mainContent.messagePopUpItems.find('.popup-item:nth-child(7) strong').should('contain', 'here');
		});
	});
});
