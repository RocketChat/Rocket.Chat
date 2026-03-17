import {
	ajv,
	isMailerProps,
	isMailerUnsubscribeProps,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { sendMail } from '../../../mail-messages/server/functions/sendMail';
import { Mailer } from '../../../mail-messages/server/lib/Mailer';
import { API } from '../api';

API.v1.post(
	'mailer',
	{
		authRequired: true,
		body: isMailerProps,
		permissionsRequired: ['send-mail'],
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: true,
			}),
			401: validateUnauthorizedErrorResponse,
			403: validateForbiddenErrorResponse,
		},
	},
	async function action() {
		const { from, subject, body, dryrun, query } = this.bodyParams;

		const result = await sendMail({ from, subject, body, dryrun: Boolean(dryrun), query });

		return API.v1.success(result);
	},
);

API.v1.post(
	'mailer.unsubscribe',
	{
		authRequired: true,
		body: isMailerUnsubscribeProps,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 1 },
		response: {
			200: ajv.compile({
				type: 'object',
				properties: {
					success: { type: 'boolean', enum: [true] },
				},
				required: ['success'],
				additionalProperties: false,
			}),
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { _id, createdAt } = this.bodyParams;

		await Mailer.unsubscribe(_id, createdAt);

		return API.v1.success();
	},
);
