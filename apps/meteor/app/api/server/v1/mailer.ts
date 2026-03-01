import {
	ajv,
	validateBadRequestErrorResponse,
	validateUnauthorizedErrorResponse,
	validateForbiddenErrorResponse,
} from '@rocket.chat/rest-typings';

import { sendMail } from '../../../mail-messages/server/functions/sendMail';
import { Mailer } from '../../../mail-messages/server/lib/Mailer';
import type { ExtractRoutesFromAPI } from '../ApiClass';
import { API } from '../api';

type MailerProps = {
	from: string;
	subject: string;
	body: string;
	dryrun?: boolean;
	query?: string;
};

const isMailerProps = ajv.compile<MailerProps>({
	type: 'object',
	properties: {
		from: { type: 'string' },
		subject: { type: 'string' },
		body: { type: 'string' },
		dryrun: { type: 'boolean', nullable: true },
		query: { type: 'string', nullable: true },
	},
	required: ['from', 'subject', 'body'],
	additionalProperties: false,
});

type MailerUnsubscribeProps = {
	_id: string;
	createdAt: string;
};

const isMailerUnsubscribeProps = ajv.compile<MailerUnsubscribeProps>({
	type: 'object',
	properties: {
		_id: { type: 'string' },
		createdAt: { type: 'string' },
	},
	required: ['_id', 'createdAt'],
	additionalProperties: false,
});

const mailerEndpoints = API.v1
	.post(
		'mailer',
		{
			authRequired: true,
			body: isMailerProps,
			permissionsRequired: ['send-mail'],
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
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
	)
	.post(
		'mailer.unsubscribe',
		{
			authRequired: true,
			body: isMailerUnsubscribeProps,
			rateLimiterOptions: { intervalTimeInMS: 60000, numRequestsAllowed: 1 },
			response: {
				200: ajv.compile<void>({
					type: 'object',
					properties: {
						success: { type: 'boolean', enum: [true] },
					},
					required: ['success'],
					additionalProperties: false,
				}),
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

export type MailerEndpoints = ExtractRoutesFromAPI<typeof mailerEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface
	interface Endpoints extends MailerEndpoints {}
}
