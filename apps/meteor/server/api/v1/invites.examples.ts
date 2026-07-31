import type { OpenAPIDocumentation } from '@rocket.chat/http-router';

/**
 * Request and response examples for the invites endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
export const invitesExamples = {
	'listInvites': {
		response: {
			'200': {
				Success: {
					value: [
						{
							_id: 'kDKQ3H',
							days: 1,
							maxUses: 1,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:31:56.774Z',
							expires: '2019-12-21T03:31:56.774Z',
							uses: 1,
							_updatedAt: '2019-12-20T03:33:40.065Z',
						},
						{
							_id: '99ScEP',
							days: 1,
							maxUses: 0,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:38:20.485Z',
							expires: '2019-12-21T03:38:20.485Z',
							uses: 0,
							_updatedAt: '2019-12-20T03:38:20.485Z',
						},
						{
							_id: 'Y5JKM4',
							days: 0,
							maxUses: 1,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:38:25.313Z',
							expires: null,
							uses: 1,
							_updatedAt: '2019-12-20T03:38:40.116Z',
						},
					],
				},
			},
		},
	},
	'findOrCreateInvite': {
		response: {
			'200': {
				Success: {
					value: [
						{
							_id: 'kDKQ3H',
							days: 1,
							maxUses: 1,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:31:56.774Z',
							expires: '2019-12-21T03:31:56.774Z',
							uses: 1,
							_updatedAt: '2019-12-20T03:33:40.065Z',
						},
						{
							_id: '99ScEP',
							days: 1,
							maxUses: 0,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:38:20.485Z',
							expires: '2019-12-21T03:38:20.485Z',
							uses: 0,
							_updatedAt: '2019-12-20T03:38:20.485Z',
						},
						{
							_id: 'Y5JKM4',
							days: 0,
							maxUses: 1,
							rid: 's7CE842q9WtvLctD7',
							userId: 'sNiDqHit5nGAGFg8X',
							createdAt: '2019-12-20T03:38:25.313Z',
							expires: null,
							uses: 1,
							_updatedAt: '2019-12-20T03:38:40.116Z',
						},
					],
				},
			},
		},
		body: {
			Example: {
				value: {
					rid: 'csFYrDeixJG7PnrAh',
					days: 10,
					maxUses: 0,
				},
			},
		},
	},
	'removeInvite/:_id': {
		response: {
			'400': {
				'Invalid Invitation Id': {
					value: {
						success: false,
						error: 'Invalid Invitation _id [invalid-invitation-id]',
						errorType: 'invalid-invitation-id',
						details: {
							method: 'removeInvite',
						},
					},
				},
			},
		},
	},
	'useInviteToken': {
		response: {
			'200': {
				'Success Example': {
					value: {
						room: {
							_id: 'sN9KJZX2aX7aXqB2a',
							name: 'general',
							topic: 'General discussion',
						},
						success: true,
					},
				},
			},
			'400': {
				'User Is Banned': {
					value: {
						success: false,
						error: 'User is banned from this room',
						errorType: 'error-user-is-banned',
					},
				},
				'Invalid Token': {
					value: {
						success: false,
						error: 'Invalid invite token',
						errorType: 'error-invalid-token',
					},
				},
				'Token Expired': {
					value: {
						success: false,
						error: 'Invite token has expired',
						errorType: 'error-invite-token-expired',
					},
				},
			},
		},
		body: {
			'Use Invite Token': {
				value: {
					token: 'R4VDXJ9KJZB8M2QW',
				},
			},
		},
	},
	'sendInvitationEmail': {
		response: {
			'400': {
				'Example 1': {
					value: {
						success: false,
						error: "must have required property 'emails' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			'Example 1': {
				value: {
					emails: ['example@example.com'],
				},
			},
		},
	},
} satisfies Record<string, NonNullable<OpenAPIDocumentation['examples']>>;
