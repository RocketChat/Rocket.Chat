/**
 * Request and response examples for the mailer endpoints, imported from
 * RocketChat/Rocket.Chat-Open-API. Kept out of the route options so they stay readable.
 */
/**
 * Local on purpose: importing the framework type here would put the examples in the type graph of
 * every endpoint that uses them, and this module only needs to describe their shape.
 */
type PayloadExamples = {
	query?: Record<string, unknown>;
	params?: Record<string, unknown>;
	body?: unknown;
	response?: Record<number, unknown>;
};

export const mailerExamples: Record<string, PayloadExamples> = {
	'mailer': {
		response: {
			'400': {
				'Invalid From Address': {
					value: {
						success: false,
						error: 'Invalid from address [error-invalid-from-address]',
						errorType: 'error-invalid-from-address',
						details: {
							function: 'Mailer.sendMail',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					from: 'test.test@test.com',
					subject: 'Welcome to the Test Newsletter',
					body: 'Thank you for subscribing to the Test Newsletter. If this was not you feel free to unsubscribe by hitting the following button [unsubscribe]',
					dryrun: 'true',
				},
			},
		},
	},
	'mailer.unsubscribe': {
		body: {
			Example: {
				value: {
					_id: 'c6Lsa9SFVFxJLR56H',
					createdAt: '1692284808957',
				},
			},
		},
	},
};
