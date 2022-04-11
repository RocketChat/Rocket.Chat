import { Meteor } from 'meteor/meteor';

import { Logger } from '../../../logger/server';
import { settings } from '../../../settings/server';
import { IMAPIntercepter, POP3Helper, POP3 } from '../lib/interceptDirectReplyEmails.js';

const logger = new Logger('Email Intercepter');

let IMAP;
let _POP3Helper;

settings.watchMultiple(
	[
		'Direct_Reply_Enable',
		'Direct_Reply_Protocol',
		'Direct_Reply_Host',
		'Direct_Reply_Port',
		'Direct_Reply_Username',
		'Direct_Reply_Password',
		'Direct_Reply_Protocol',
		'Direct_Reply_Protocol',
	],
	function () {
		logger.debug('Starting Email Intercepter...');

		if (
			settings.get('Direct_Reply_Enable') &&
			settings.get('Direct_Reply_Protocol') &&
			settings.get('Direct_Reply_Host') &&
			settings.get('Direct_Reply_Port') &&
			settings.get('Direct_Reply_Username') &&
			settings.get('Direct_Reply_Password')
		) {
			if (settings.get('Direct_Reply_Protocol') === 'IMAP') {
				// stop already running IMAP instance
				if (IMAP && IMAP.isActive()) {
					logger.debug('Disconnecting already running IMAP instance...');
					IMAP.stop(
						Meteor.bindEnvironment(function () {
							logger.debug('Starting new IMAP instance......');
							IMAP = new IMAPIntercepter();
							IMAP.start();
							return true;
						}),
					);
				} else if (POP3 && _POP3Helper && _POP3Helper.isActive()) {
					logger.debug('Disconnecting already running POP instance...');
					_POP3Helper.stop(
						Meteor.bindEnvironment(function () {
							logger.debug('Starting new IMAP instance......');
							IMAP = new IMAPIntercepter();
							IMAP.start();
							return true;
						}),
					);
				} else {
					logger.debug('Starting new IMAP instance......');
					IMAP = new IMAPIntercepter();
					IMAP.start();
					return true;
				}
			} else if (settings.get('Direct_Reply_Protocol') === 'POP') {
				// stop already running POP instance
				if (POP3 && _POP3Helper && _POP3Helper.isActive()) {
					logger.debug('Disconnecting already running POP instance...');
					_POP3Helper.stop(
						Meteor.bindEnvironment(function () {
							logger.debug('Starting new POP instance......');
							_POP3Helper = new POP3Helper();
							_POP3Helper.start();
							return true;
						}),
					);
				} else if (IMAP && IMAP.isActive()) {
					logger.debug('Disconnecting already running IMAP instance...');
					IMAP.stop(
						Meteor.bindEnvironment(function () {
							logger.debug('Starting new POP instance......');
							_POP3Helper = new POP3Helper();
							_POP3Helper.start();
							return true;
						}),
					);
				} else {
					logger.debug('Starting new POP instance......');
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
	},
);
