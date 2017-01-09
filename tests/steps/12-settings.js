/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import supertest from 'supertest';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';

import flexTab from '../pageobjects/flex-tab.page';
import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';

//test data imports
import {checkIfUserIsValid} from '../data/checks';

import {adminUsername, adminEmail, adminPassword, username, email, password} from '../data/user.js';

function api(path) {
	return prefix + path;
}

function log(res) {
	console.log(res.req.path);
	console.log({
		body: res.body,
		headers: res.headers
	});
}

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};

var settingValue = {
	value : undefined
};

describe('Changing settings via api', () => {
	before((done) => {
		checkIfUserIsValid(username, email, password);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');

		request.post(api('login'))
			.send(login)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				credentials['X-Auth-Token'] = res.body.data.authToken;
				credentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
	});

	describe('message edit', () => {
		it('it should change the message editing via api', (done) => {
			request.post(api('settings/Message_AllowEditing'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should not show the edit messages', () => {
			browser.pause(300);
			mainContent.sendMessage('Message for Message Edit Block');
			mainContent.openMessageActionMenu();
			mainContent.messageEdit.isVisible().should.be.false;
		});
	});

	describe('message delete', () => {

		it('it should change the message deleting via api', (done) => {
			request.post(api('settings/Message_AllowDeleting'))
				.set(credentials)
				.send({'value' : false})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should not show the delete messages', () => {
			browser.pause(300);
			mainContent.sendMessage('Message for Message delete Block');
			mainContent.openMessageActionMenu();
			mainContent.messageDelete.isVisible().should.be.false;
		});
	});
});