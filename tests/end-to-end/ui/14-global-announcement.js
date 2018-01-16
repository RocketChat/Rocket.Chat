import supertest from 'supertest';
import {adminUsername, adminEmail, adminPassword} from '../../data/user.js';
import loginPage from '../../pageobjects/login.page';
import mainContent from '../../pageobjects/main-content.page';
import {checkIfUserIsValid} from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';

export const rcrequest = supertest.agent('http://localhost:3000');

describe('[Rocket.Chat Global Announcement Tests]', function () {
	var userId;
	var authToken;
	var message = "This is a global test announcement!";

	it('Login to Rocket.Chat api', function (done) {
		rcrequest.post('/api/v1/login')
			.set('Content-Type', 'application/json')
			.send({
				username: adminUsername,
				password: adminPassword
			})
			.end(function (err, res) {
				authToken = res.body.data.authToken;
				userId = res.body.data.userId;
				expect(res.status).to.be.equal(200);
				done();
			});
	});

	it('Create global announcement', function (done) {
		rcrequest.post('/api/v1/settings/Layout_Global_Announcement')
			.set('X-Auth-Token', authToken)
			.set('X-User-Id', userId)
			.send({
				value: message
			})
			.expect(200)
			.end(done);
	});

	it('Login-Page announcement should be there', function () {
		loginPage.open();
		loginPage.GlobalAnnouncement.isVisible().should.equal(true);
		loginPage.GlobalAnnouncement.getText().should.equal(message);
	});

	it('Home-Page announcement should be there', function () {
		checkIfUserIsValid(adminUsername, adminEmail, adminPassword);
		mainContent.GlobalAnnouncement.isVisible().should.equal(true);
		mainContent.GlobalAnnouncement.getText().should.equal('OK, GOT IT\n'+message);
		mainContent.GlobalAnnouncementBtn.isVisible().should.equal(true);
		mainContent.GlobalAnnouncementBtn.click();
		mainContent.GlobalAnnouncement.isVisible().should.equal(false);
		sideNav.logoutRocketchat();
	});

	it('Remove global announcement', function (done) {
		rcrequest.post('/api/v1/settings/Layout_Global_Announcement')
			.set('X-Auth-Token', authToken)
			.set('X-User-Id', userId)
			.send({
				value: null
			})
			.expect(200)
			.end(done);
	});

	it('Login-Page announcement should not be there', function () {
		loginPage.open();
		loginPage.GlobalAnnouncement.isVisible().should.equal(false);
	});

	it('Logout from Rocketchat api', function (done) {
		rcrequest.get('/api/v1/logout')
			.set('X-Auth-Token', authToken)
			.set('X-User-Id', userId)
			.expect(200)
			.end(done);
	});
});
