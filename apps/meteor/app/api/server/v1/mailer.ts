import { isMailerProps, isMailerUnsubscribeProps } from '@rocket.chat/rest-typings';

import { API } from '../api';
import { hasPermission } from '../../../authorization/server/functions/hasPermission';

API.v1.addRoute(
	'mailer',
	{
		authRequired: true,
		validateParams: isMailerProps,
	},
	{
		async post() {
			if (!hasPermission(this.userId, 'send-mail')) {
				throw new Error('error-not-allowed');
			}

			const { from, subject, body, dryrun, query } = this.bodyParams;

			const result = Meteor.call('Mailer.sendMail', from, subject, body, Boolean(dryrun), query);

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'mailer.unsubscribe',
	{
		authRequired: true,
		validateParams: isMailerUnsubscribeProps,
	},
	{
		async post() {
			const { _id, createdAt } = this.bodyParams;

			const result = Meteor.call('Mailer:unsubscribe', _id, createdAt);

			return API.v1.success(result);
		},
	},
);
