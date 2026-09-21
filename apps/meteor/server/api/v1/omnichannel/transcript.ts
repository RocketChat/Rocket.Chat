import { Omnichannel } from '@rocket.chat/core-services';
import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import {
	ajv,
	isPOSTLivechatTranscriptParams,
	isPOSTLivechatTranscriptRequestParams,
	validateBadRequestErrorResponse,
	validateForbiddenErrorResponse,
	validateUnauthorizedErrorResponse,
} from '@rocket.chat/rest-typings';
// eslint-disable-next-line import-x/named
import { Meteor } from 'meteor/meteor';

import { i18n } from '../../../lib/i18n';
import { requestTranscript, sendTranscript } from '../../../lib/omnichannel/sendTranscript';
import type { ExtractRoutesFromAPI } from '../../ApiClass';
import { API } from '../../api';

const transcriptSendResponseSchema = ajv.compile<{ message: string; success: true }>({
	type: 'object',
	properties: {
		message: { type: 'string' },
		success: { type: 'boolean', enum: [true] },
	},
	required: ['message', 'success'],
	additionalProperties: false,
});

const transcriptVoidResponseSchema = ajv.compile<void>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [true] },
	},
	required: ['success'],
	additionalProperties: false,
});

const transcriptBadRequestResponseSchema = ajv.compile<{
	success: false;
	message?: string;
	error?: string;
	errorType?: string;
	stack?: string;
	details?: string | object | object[];
}>({
	type: 'object',
	properties: {
		success: { type: 'boolean', enum: [false] },
		message: { type: 'string' },
		stack: { type: 'string' },
		error: { type: 'string' },
		errorType: { type: 'string' },
		details: { anyOf: [{ type: 'string' }, { type: 'object' }, { type: 'array' }] },
	},
	required: ['success'],
	additionalProperties: false,
});

const livechatTranscriptEndpoints = API.v1
	.post(
		'livechat/transcript',
		{
			authRequired: false,
			rateLimiterOptions: {
				numRequestsAllowed: 5,
				intervalTimeInMS: 60000,
			},
			body: isPOSTLivechatTranscriptParams,
			response: {
				200: transcriptSendResponseSchema,
				400: transcriptBadRequestResponseSchema,
			},
		},
		async function action() {
			const { token, rid, email } = this.bodyParams;
			if (!(await sendTranscript({ token, rid, email }))) {
				return API.v1.failure({ message: i18n.t('Error_sending_livechat_transcript') });
			}

			return API.v1.success({ message: i18n.t('Livechat_transcript_sent') });
		},
	)
	.delete(
		'livechat/transcript/:rid',
		{
			authRequired: true,
			permissionsRequired: ['send-omnichannel-chat-transcript'],
			response: {
				200: transcriptVoidResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { rid } = this.urlParams;
			const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, 'open' | 'transcriptRequest' | 'v'>>(rid, {
				projection: { open: 1, transcriptRequest: 1, v: 1 },
			});

			if (!room?.open) {
				throw new Meteor.Error('error-invalid-room', 'Invalid room');
			}
			if (!room.transcriptRequest) {
				throw new Meteor.Error('error-transcript-not-requested', 'Transcript not requested');
			}

			if (!(await Omnichannel.isWithinMACLimit(room))) {
				throw new Meteor.Error('error-mac-limit-reached', 'MAC limit reached');
			}

			await LivechatRooms.unsetEmailTranscriptRequestedByRoomId(rid);

			return API.v1.success();
		},
	)
	.post(
		'livechat/transcript/:rid',
		{
			authRequired: true,
			permissionsRequired: ['send-omnichannel-chat-transcript'],
			body: isPOSTLivechatTranscriptRequestParams,
			response: {
				200: transcriptVoidResponseSchema,
				400: validateBadRequestErrorResponse,
				401: validateUnauthorizedErrorResponse,
				403: validateForbiddenErrorResponse,
			},
		},
		async function action() {
			const { rid } = this.urlParams;
			const { email, subject } = this.bodyParams;

			const user = await Users.findOneById(this.userId, {
				projection: { _id: 1, username: 1, name: 1, utcOffset: 1 },
			});

			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user');
			}

			await requestTranscript({ rid, email, subject, user });

			return API.v1.success();
		},
	);

type LivechatTranscriptEndpoints = ExtractRoutesFromAPI<typeof livechatTranscriptEndpoints>;

declare module '@rocket.chat/rest-typings' {
	// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
	interface Endpoints extends LivechatTranscriptEndpoints {}
}
