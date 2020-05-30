import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings } from '../../../settings';
import { IMAPIntercepter, POP3Helper, POP3 } from '../lib/interceptDirectReplyEmails.js';


let IMAP;
let _POP3Helper;

const startEmailIntercepter = _.debounce(Meteor.bindEnvironment(function() {
	console.log('Starting Email Intercepter...');

	if (settings.get('Direct_Reply_Enable') && settings.get('Direct_Reply_Protocol') && settings.get('Direct_Reply_Host') && settings.get('Direct_Reply_Port') && settings.get('Direct_Reply_Username') && settings.get('Direct_Reply_Password')) {
		if (settings.get('Direct_Reply_Protocol') === 'IMAP') {
			// stop already running IMAP instance
			if (IMAP && IMAP.isActive()) {
				console.log('Disconnecting already running IMAP instance...');
				IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new IMAP instance......');
					IMAP = new IMAPIntercepter();
					IMAP.start();
					return true;
				}));
			} else if (POP3 && _POP3Helper && _POP3Helper.isActive()) {
				console.log('Disconnecting already running POP instance...');
				_POP3Helper.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new IMAP instance......');
					IMAP = new IMAPIntercepter();
					IMAP.start();
					return true;
				}));
			} else {
				console.log('Starting new IMAP instance......');
				IMAP = new IMAPIntercepter();
				IMAP.start();
				return true;
			}
		} else if (settings.get('Direct_Reply_Protocol') === 'POP') {
			// stop already running POP instance
			if (POP3 && _POP3Helper && _POP3Helper.isActive()) {
				console.log('Disconnecting already running POP instance...');
				_POP3Helper.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new POP instance......');
					_POP3Helper = new POP3Helper();
					_POP3Helper.start();
					return true;
				}));
			} else if (IMAP && IMAP.isActive()) {
				console.log('Disconnecting already running IMAP instance...');
				IMAP.stop(Meteor.bindEnvironment(function() {
					console.log('Starting new POP instance......');
					_POP3Helper = new POP3Helper();
					_POP3Helper.start();
					return true;
				}));
			} else {
				console.log('Starting new POP instance......');
				_POP3Helper = new POP3Helper();
				_POP3Helper.start();
				return true;
			}
		}
	} else if (IMAP && IMAP.isActive()) {
		// stop IMAP instance
		IMAP.stop();
	} else if (POP3 && _POP3Helper.isActive()) {
		// stop POP3 instance
		_POP3Helper.stop();
	}
}), 1000);

settings.onload(/^Direct_Reply_.+/, startEmailIntercepter);
