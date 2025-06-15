import { isMailerProps, isMailerUnsubscribeProps } from '@rocket.chat/rest-typings';
import Ajv from 'ajv';

import { sendMail } from '../../../mail-messages/server/functions/sendMail';
import { Mailer } from '../../../mail-messages/server/lib/Mailer';
import { API } from '../api';

const ajv = new Ajv();

API.v1.post(
	'/mailer',
	{
		authRequired: true,
		permissionsRequired: ['send-mail'],
		validateParams: isMailerProps,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},
	async function () {
		const { from, subject, body, dryrun, query } = this.bodyParams;
		console.log('[Mailer Endpoint Hit]', { from, subject, body, dryrun, query });

		const result = await sendMail({ from, subject, body, dryrun: Boolean(dryrun), query });
		return API.v1.success(result);
	},
);

API.v1.post(
	'/mailer.unsubscribe',
	{
		rateLimiterOptions: {
			intervalTimeInMS: 60000,
			numRequestsAllowed: 1,
		},
		validateParams: isMailerUnsubscribeProps,
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean' },
				},
				required: ['success'],
				additionalProperties: false,
			}),
		},
	},
	async function () {
		const { _id, createdAt } = this.bodyParams;
		console.log('[Unsubscribe Endpoint Hit]', { _id, createdAt });

		await Mailer.unsubscribe(_id, createdAt);
		return API.v1.success();
	},
);
