import { adminEmail, adminPassword } from '../../data/user.js';
import {
	api,
	request,
	getCredentials,
	credentials,
} from '../../data/api-data.js';
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
		isMentionable: i % 2 === 0,
	}));

const createTestUser = async ({ email, name, username, password, isMentionable }) => {
	await new Promise((done) => getCredentials(done));

	await new Promise((done) => request.post(api('users.create'))
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
		.end(done)
	);

	if (isMentionable) {
		const userCredentials = {};

		await new Promise((done) => request.post(api('login'))
			.send({ user: username, password })
			.expect((res) => {
				userCredentials['X-Auth-Token'] = res.body.data.authToken;
				userCredentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done)
		);

		await new Promise((done) => request.post(api('chat.postMessage'))
			.set(userCredentials)
			.send({
				channel: 'general',
				text: 'Test',
			})
			.end(done)
		);
	}
};

describe('[Message Popup]', () => {
	describe('test user mentions in message popup', () => {
		before(() => {
			browser.executeAsync((done) => {
				const user = Meteor.user();
				if (!user) {
					return done();
				}
				Meteor.logout(done);
			});

			browser.call(async () => {
				for (const user of users) {
					await createTestUser(user); // eslint-disable-line no-await-in-loop
				}
			});

			loginPage.open();
			loginPage.login({ email: adminEmail, password: adminPassword });

			sideNav.general.waitForVisible(5000);
			sideNav.general.click();
		});

		after(() => {
			browser.executeAsync((done) => {
				Meteor.logout(done);
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

		it('should show the message popup bar items', () => {
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
