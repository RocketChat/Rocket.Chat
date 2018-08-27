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

	describe('Prepare private channel', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
		});

		it('create private channel', (done)=> {
			try {
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

	describe('Request join as user', function() {

		before(()=>{
			checkIfUserIsValid(username, email, password);
		});

		it('find channel in private rooms list', (done)=> {
			sideNav.showPrivateRooms();
			done();
		});

		it('open private room without permission', (done)=> {
			sideNav.selectPrivateRoomFromList(privateChannelName);
			done();
		});

		it('request to join private rom', (done)=> {
			main.requestToJoinRoom.waitForVisible(5000);
			main.requestToJoinRoom.click();
			global.enterModalText('I want to join this room');
			global.confirmPopup();
			done();
		});
	});

	describe('Decline request as room owner', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.searchChannel(privateChannelName);
		});

		it('decline join request', (done)=> {
			main.declineJoinRequest.waitForVisible(5000);
			main.declineJoinRequest.click();
			done();
		});
	});

	describe('Request join as user a second time', function() {

		before(()=>{
			checkIfUserIsAdmin(username, email, password);
		});

		it('find channel in private rooms list', (done)=> {
			sideNav.showPrivateRooms();
			done();
		});

		it('open private room without permission', (done)=> {
			sideNav.selectPrivateRoomFromList(privateChannelName);
			done();
		});

		it('request to join private rom', (done)=> {
			main.requestToJoinRoom.waitForVisible(5000);
			main.requestToJoinRoom.click();
			global.enterModalText('I want to join this room again');
			global.confirmPopup();
			done();
		});
	});

	describe('Accept request as room owner', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.searchChannel(privateChannelName);
		});

		it('accept join request', (done)=> {
			main.acceptJoinRequest.waitForVisible(5000);
			main.acceptJoinRequest.click();
			done();
		});
	});

	describe('Request join as user a second time', function() {

		before(()=>{
			checkIfUserIsAdmin(username, email, password);
			sideNav.searchChannel(privateChannelName);
		});

		it('user can now access the room and write a message', (done)=> {
			main.sendMessage('Thanks for the invitation');
			done();
		});

	});

	describe('[Cleanup]', function() {

		before(()=>{
			checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword);
			sideNav.searchChannel(privateChannelName);
		});

		it('delete private room', (done)=> {
			flexTab.operateFlexTab('info', true);
			flexTab.editBtn.click();
			flexTab.deleteBtn.click();
			global.modal.waitForVisible(5000);
			global.confirmPopup();
			done();
		});
	});
});
