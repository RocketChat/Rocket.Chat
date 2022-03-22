import sideNav from '../pageobjects/side-nav.page';
import { publicChannelName, privateChannelName } from '../../data/channel.js';
import { targetUser } from '../../data/interactions.js';
import { checkIfUserIsValid, setPublicChannelCreated, setPrivateChannelCreated, setDirectMessageCreated } from '../../data/checks';
import { username, email, password } from '../../data/user.js';

// Basic usage test start
describe('[Channel creation]', function () {
	before(() => {
		checkIfUserIsValid(username, email, password);
	});

	describe('public channel:', function () {
		it('it should create a public channel', function () {
			sideNav.createChannel(publicChannelName, false, false);
			setPublicChannelCreated(true);
		});
	});

	describe('private channel:', function () {
		it('it should create a private channel', function () {
			sideNav.createChannel(privateChannelName, true, false);
			setPrivateChannelCreated(true);
		});
	});

	describe('direct message:', function () {
		it('it should start a direct message with rocket.cat', function () {
			sideNav.spotlightSearchIcon.click();
			sideNav.searchChannel(targetUser);
			setDirectMessageCreated(true);
		});
	});
});
