import _ from 'underscore';
import { IMAPIntercepter } from '../lib/interceptDirectReplyEmails.js';
import { POP3Helper } from '../lib/interceptDirectReplyEmails.js';

const startEmailIntercepter = _.debounce(Meteor.bindEnvironment(function() {
	console.log('Starting Email Intercepter...');

	if (RocketChat.settings.get('Direct_Reply_Enable') && RocketChat.settings.get('Direct_Reply_Protocol') && RocketChat.settings.get('Direct_Reply_Host') && RocketChat.settings.get('Direct_Reply_Port') && RocketChat.settings.get('Direct_Reply_Username') && RocketChat.settings.get('Direct_Reply_Password')) {
		if (RocketChat.settings.get('Direct_Reply_Protocol') === 'IMAP') {
			// stop already running IMAP instance
			if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
				console.log('Disconnecting already running IMAP instance...');
				RocketChat.IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new IMAP instance......');
					RocketChat.IMAP = new IMAPIntercepter();
					RocketChat.IMAP.start();
					return true;
				}));
			} else if (RocketChat.POP3 && RocketChat.POP3Helper && RocketChat.POP3Helper.isActive()) {
				console.log('Disconnecting already running POP instance...');
				RocketChat.POP3Helper.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new IMAP instance......');
					RocketChat.IMAP = new IMAPIntercepter();
					RocketChat.IMAP.start();
					return true;
				}));
			} else {
				console.log('Starting new IMAP instance......');
				RocketChat.IMAP = new IMAPIntercepter();
				RocketChat.IMAP.start();
				return true;
			}
		} else if (RocketChat.settings.get('Direct_Reply_Protocol') === 'POP') {
			// stop already running POP instance
			if (RocketChat.POP3 && RocketChat.POP3Helper && RocketChat.POP3Helper.isActive()) {
				console.log('Disconnecting already running POP instance...');
				RocketChat.POP3Helper.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new POP instance......');
					RocketChat.POP3Helper = new POP3Helper();
					RocketChat.POP3Helper.start();
					return true;
				}));
			} else if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
				console.log('Disconnecting already running IMAP instance...');
				RocketChat.IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new POP instance......');
					RocketChat.POP3Helper = new POP3Helper();
					RocketChat.POP3Helper.start();
					return true;
				}));
			} else {
				console.log('Starting new POP instance......');
				RocketChat.POP3Helper = new POP3Helper();
				RocketChat.POP3Helper.start();
				return true;
			}
		}
	} else if (RocketChat.IMAP && RocketChat.IMAP.isActive()) {
		// stop IMAP instance
		RocketChat.IMAP.stop();
	} else if (RocketChat.POP3 && RocketChat.POP3Helper.isActive()) {
		// stop POP3 instance
		RocketChat.POP3Helper.stop();
	}
}), 1000);

RocketChat.settings.onload(/^Direct_Reply_.+/, startEmailIntercepter);
