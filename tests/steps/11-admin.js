/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../pageobjects/side-nav.page';
import admin from '../pageobjects/administration.page';

//test data imports
import {checkIfUserIsAdmin} from '../data/checks';
import {adminUsername, adminEmail, adminPassword} from '../data/user.js';

describe('Admin Login', () => {
	before(() => {
		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		sideNav.getChannelFromList('general').waitForExist(5000);
		sideNav.openChannel('general');
	});

	describe('Enter the admin view', () => {
		before(() => {
			sideNav.accountBoxUserName.click();
			sideNav.admin.waitForVisible(5000);

		});

		it('Enter the admin view', () => {
			sideNav.admin.click();
			admin.flexNavContent.waitForVisible(5000);
		});
	});
});
