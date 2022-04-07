/* eslint-disable func-names, prefer-arrow-callback, no-var, space-before-function-paren,
quotes, prefer-template, no-undef, no-unused-vars*/

import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import { sendEscape } from '../pageobjects/keyboard';
import { discussion } from '../pageobjects/discussion.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';

const parentChannelName = 'unit-testing-' + Date.now();
const discussionName = 'Lorem ipsum dolor sit amet';
const message = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';

describe('[Discussion]', function () {
	before(function () {
		checkIfUserIsValid(username, email, password);
		sideNav.createChannel(parentChannelName, true, false);
		cy.wait(1000);
	});

	describe('via creation screen', function () {
		it('Create a discussion', function () {
			discussion.createDiscussion(parentChannelName, discussionName, message);
			cy.wait(1000);
		});
	});

	describe('from context menu', function () {
		before(() => {
			mainContent.sendMessage(message);
			cy.wait(1000);
		});

		it('it should show a dialog for starting a discussion', () => {
			cy.wait(1000);
			mainContent.openMessageActionMenu();
			cy.waitUntil(() => {
				return discussion.startDiscussionContextItem.then((el) => el.length);
			});
			discussion.startDiscussionContextItem.click();
			discussion.saveDiscussionButton.should('be.enabled');
			discussion.saveDiscussionButton.click();
			cy.wait(1000);
		});

		it('it should have create a new room', function () {
			mainContent.channelTitle.should('contain', message);
		});

		it('The message should be copied', function () {
			cy.wait(1200);
			mainContent.waitForLastMessageQuoteEqualsText(message);
		});
	});

	after(function () {
		it('remove parent channel', () => {
			discussion.deleteRoom(parentChannelName);
		});
	});
});
