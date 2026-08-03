import {
	ajv,
	isMailerProps,
	isMailerUnsubscribeProps,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
	validateBadRequestErrorResponse,
} from '@rocket.chat/rest-typings';

import { mailerExamples } from './mailer.examples';
import { sendMail } from '../../lib/notifications/mail-messages/functions/sendMail';
import { Mailer } from '../../lib/notifications/mail-messages/lib/Mailer';
import { API } from '../api';

const mailerResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: true,
});

const mailerUnsubscribeResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

API.v1.post(
	'mailer',
	{
		summary: 'Send Mailer Endpoint',
		description: `Send emails to users from your workspace. Make sure that you have configured the <a href='https://docs.rocket.chat/docs/configure-email' target='_blank'>email settings</a> in the workspace.

| Version      | Description |
| ---------------- | ------------|
|5.4.0      | Added      |`,
		examples: mailerExamples.mailer,
		authRequired: true,
		body: isMailerProps,
		permissionsRequired: ['send-mail'],
		response: {
			200: mailerResponseSchema,
			400: validateBadRequestErrorResponse,
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
		summary: 'Mailer Unsubscribe Endpoint',
		description: `Send emails to users from your workspace.

### Changelog
| Version      | Description |
| ------------ | ------------|
|5.4.0         | Added      |`,
		examples: mailerExamples['mailer.unsubscribe'],
		authRequired: true,
		body: isMailerUnsubscribeProps,
		rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 1 },
		response: {
			200: mailerUnsubscribeResponseSchema,
			401: validateUnauthorizedErrorResponse,
		},
	},
	async function action() {
		const { _id, createdAt } = this.bodyParams;

		await Mailer.unsubscribe(_id, createdAt);

		return API.v1.success();
	},
);
