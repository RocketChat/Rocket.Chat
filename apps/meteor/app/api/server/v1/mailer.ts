import { isMailerProps, isMailerUnsubscribeProps } from '@rocket.chat/rest-typings';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { API } from '../api';

API.v1.addRoute(
	'mailer',
	{
		authRequired: true,
		validateParams: isMailerProps,
	},
	{
		async post() {
			if (!(await hasPermissionAsync(this.userId, 'send-mail'))) {
				throw new Error('error-not-allowed');
			}

			const { from, subject, body, dryrun, query } = this.bodyParams;

			const result = await Meteor.callAsync('Mailer.sendMail', from, subject, body, Boolean(dryrun), query);

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

			await Meteor.callAsync('Mailer:unsubscribe', _id, createdAt);

			return API.v1.success();
		},
	},
);
