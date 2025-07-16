import { isMailerProps, isMailerUnsubscribeProps } from '@rocket.chat/rest-typings';

import { sendMail } from '../../../mail-messages/server/functions/sendMail';
import { Mailer } from '../../../mail-messages/server/lib/Mailer';
import { API } from '../api';

API.v1.addRoute(
	'mailer',
	{
		authRequired: true,
		validateParams: isMailerProps,
		permissionsRequired: ['send-mail'],
	},
	{
		async post() {
			const { from, subject, body, dryrun, query } = this.bodyParams;

			const result = await sendMail({ from, subject, body, dryrun: Boolean(dryrun), query });

			return API.v1.success(result);
		},
	},
);

API.v1.addRoute(
	'mailer.unsubscribe',
	{
		authRequired: true,
		validateParams: isMailerUnsubscribeProps,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 1 },
	},
	{
		async post() {
			const { _id, createdAt } = this.bodyParams;

			await Mailer.unsubscribe(_id, createdAt);

			return API.v1.success();
		},
	},
);
