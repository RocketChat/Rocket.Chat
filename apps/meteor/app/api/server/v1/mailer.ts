import {
	ajv,
	isMailerProps,
	isMailerUnsubscribeProps,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';

import { sendMail } from '../../../mail-messages/server/functions/sendMail';
import { Mailer } from '../../../mail-messages/server/lib/Mailer';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

const mailerSuccessResponse = ajv.compile<void>({
	type: 'object',
	properties: { success: { type: 'boolean', enum: [true] } },
	required: ['success'],
	additionalProperties: false,
});

const mailerEndpoints = API.v1
	.post(
		'mailer',
		{
			authRequired: true,
			permissionsRequired: ['send-mail'],
			body: isMailerProps,
			response: {
				200: mailerSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { from, subject, body, dryrun, query } = this.bodyParams;

			await sendMail({ from, subject, body, dryrun: Boolean(dryrun), query });

			return API.v1.success();
		},
	)
	.post(
		'mailer.unsubscribe',
		{
			authRequired: true,
			body: isMailerUnsubscribeProps,
			rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 1 },
			response: {
				200: mailerSuccessResponse,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
			},
		},
		async function action() {
			const { _id, createdAt } = this.bodyParams;

			await Mailer.unsubscribe(_id, createdAt);

			return API.v1.success();
		},
	);

type MailerEndpoints = ExtractRoutesFromAPI<typeof mailerEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends MailerEndpoints {}
}
