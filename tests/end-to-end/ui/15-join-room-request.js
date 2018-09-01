/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import sideNav from '../../pageobjects/side-nav.page';
import main from '../../pageobjects/main-content.page';
import global from '../../pageobjects/global';
import flexTab from '../../pageobjects/flex-tab.page';

import {checkIfUserIsAdmin, checkIfUserIsValid} from '../../data/checks';
import {adminEmail, adminPassword, adminUsername, username, email, password} from '../../data/user';
const privateChannelName = 'privatetestchannel';

describe('[Join Room Request]', function() {

	describe('Create private channel', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		});

		it('create private channel', (done)=> {
			try {
				sideNav.spotlightSearchIcon.click();
				sideNav.spotlightSearch.waitForVisible(10000);
				sideNav.searchChannel(privateChannelName);
				console.log('Expertise already Exists');
			} catch (e) {
				browser.keys('u\ue00c');
				sideNav.createChannel(privateChannelName, false);
				console.log('New Expertise created');
			}
			done();
		});

	});

	describe('Request access', function() {

		before(() => {
			try {
				checkIfUserIsValid(username, email, password);
			} catch (e) {
				console.log(e);
			}
		});

		it('Search private channel on Directory', () => {
			sideNav.searchDirectory(privateChannelName, 'p');
		});

		it('Send join request', (done)=> {
			main.requestToJoinRoom.click();
			global.enterModalText('Allow me to join this room');
			global.confirmPopup();
			done();
		});
	});

	describe('Decline request as room owner', function() {
		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.spotlightSearchIcon.click();
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel(privateChannelName);
		});

		it('decline join request', (done)=> {
			main.declineJoinRequest.click();
			done();
		});
	});

	describe('Request access for the second time.', function() {

		before(()=>{
			checkIfUserIsValid(username, email, password);
		});

		it('Search private channel from Directory', () => {
			sideNav.searchDirectory(privateChannelName, 'p');
		});

		it('Request access to join the private room', (done)=> {
			main.requestToJoinRoom.click();
			global.enterModalText('Will you allow me to join for the second time?');
			global.confirmPopup();
			done();
		});
	});

	describe('Accept request as room owner', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.spotlightSearchIcon.click();
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel(privateChannelName);
		});

		it('accept join request', (done)=> {
			main.acceptJoinRequest.click();
			done();
		});
	});

	describe('Check if Requestor is able to access the room', function() {

		before(()=>{
			checkIfUserIsValid(username, email, password);
		});

		it('Search for the joined channel', () => {
			sideNav.spotlightSearchIcon.click();
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel(privateChannelName);
		});

		it('Send Message', (done)=> {
			main.sendMessage('Thanks for the adding me!!');
			done();
		});

	});

	describe('[Cleanup]', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.spotlightSearchIcon.click();
			sideNav.spotlightSearch.waitForVisible(10000);
			sideNav.searchChannel(privateChannelName);
		});

		it('Delete rooms', (done)=> {
			flexTab.operateFlexTab('info', true);
			flexTab.deleteBtn.click();
			global.modal.waitForVisible(500);
			global.confirmPopup();
			done();
		});
	});
});
