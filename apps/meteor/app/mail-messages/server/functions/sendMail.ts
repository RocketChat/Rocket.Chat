import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { escapeHTML } from '@rocket.chat/string-helpers';
import EJSON from 'ejson';
import { Meteor } from 'meteor/meteor';
import type { Filter } from 'mongodb';

import { generatePath } from '../../../../lib/utils/generatePath';
import { SystemLogger } from '../../../../server/lib/logger/system';
import * as Mailer from '../../../mailer/server/api';
import { placeholders } from '../../../utils/server/placeholders';

export const sendMail = async function ({
	from,
	subject,
	body,
	dryrun,
	query,
}: {
	from: string;
	subject: string;
	body: string;
	dryrun?: boolean;
	query?: string;
}): Promise<void> {
	Mailer.checkAddressFormatAndThrow(from, 'Mailer.sendMail');

	if (body.indexOf('[unsubscribe]') === -1) {
		throw new Meteor.Error('error-missing-unsubscribe-link', 'You must provide the [unsubscribe] link.', {
			function: 'Mailer.sendMail',
		});
	}

	let userQuery: Filter<any> = { 'mailer.unsubscribed': { $exists: 0 } };
	if (query) {
		userQuery = { $and: [userQuery, EJSON.parse(query)] };
	}

	const users = await Users.find(userQuery).toArray();

	if (dryrun) {
		for await (const u of users) {
			const user: Partial<IUser> & Pick<IUser, '_id'> = u;
			const email = `${user.name} <${user.emails?.[0].address}>`;
			const html = placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(
					generatePath('mailer/unsubscribe/:_id/:createdAt', {
						_id: user._id,
						createdAt: user.createdAt?.getTime().toString() || '',
					}),
				),
				name: user.name,
				email,
			});

			SystemLogger.debug(`Sending email to ${email}`);
			await Mailer.send({
				to: email,
				from,
				subject,
				html,
			});
		}
	}

	for await (const u of users) {
		const user: Partial<IUser> & Pick<IUser, '_id'> = u;
		if (user?.emails && Array.isArray(user.emails) && user.emails.length) {
			const email = `${user.name} <${user.emails[0].address}>`;

			const html = placeholders.replace(body, {
				unsubscribe: Meteor.absoluteUrl(
					generatePath('mailer/unsubscribe/:_id/:createdAt', {
						_id: user._id,
						createdAt: user.createdAt?.getTime().toString() || '',
					}),
				),
				name: escapeHTML(user.name || ''),
				email: escapeHTML(email),
			});
			SystemLogger.debug(`Sending email to ${email}`);
			await Mailer.send({
				to: email,
				from,
				subject,
				html,
			});
		}
	}
};
