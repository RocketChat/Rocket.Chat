/**
 * Request and response examples for the e2e endpoints, imported from
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

export const e2eExamples: Record<string, PayloadExamples> = {
	'e2e.setRoomKeyID': {
		response: {
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'rid' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'E2E Key Exists': {
					value: {
						success: false,
						error: 'E2E Key ID already exists [error-room-e2e-key-already-exists]',
						errorType: 'error-room-e2e-key-already-exists',
						details: {
							method: 'e2e.setRoomKeyID',
						},
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					rid: 'wCiXndNp5NqNY3uCc',
					keyID: 'my-UniQu3_ke4_Id',
				},
			},
		},
	},
	'e2e.fetchMyKeys': {
		response: {
			'200': {
				'Success Example': {
					value: {
						public_key:
							'{"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"oP23XEagSGIdo18Yc7TUwsM1qoRDa-pMg64lEctMQ6Dx-Q"}',
						private_key:
							'{"$binary":"2j5AaYO39PcQNK7lT3h5Zv7j7y3rVKsqlERVgty+Z2pjzuG5pCMnx63WFJCrt8Sx2KDwWvYycGs0V5TzXJhKFEpE3l5hpoP51wO1Xztnfl9TdVtCZ5ERSDhXp+t3ays0QLdD2EtZu9M+Ffgiy2gqTasB0UFXAZyDA=="}',
						success: true,
					},
				},
			},
		},
	},
	'e2e.getUsersOfRoomWithoutKey': {
		response: {
			'200': {
				'Success Example': {
					value: {
						users: [
							{
								_id: 'XycfA5CetCPuEjqxw',
								e2e: {
									public_key:
										'{"alg":"RSA-OAEP-256","e":"AQAB","ext":true,"key_ops":["encrypt"],"kty":"RSA","n":"oMO9ydjRxD3JzcAgMvyBZAc_pIOBIxOLVUChZ8mB3JNtLREC751hHT-WPZVZquWA6X4CihHejFfpIyAD_w-0MIToudTGO-f1aeE4Wc9-SBKjSQPphCuZMTwZ7iRtfUwHeGy5yM94uQPp07sEi9BmJSZqHscHc-6G520MyBhNU6uznQf-Sp85Q4etl4Ifs09khM-VMnBqKwh2QJx8w0880Vc3Zufve6udg0aSQ"}',
								},
							},
						],
						success: true,
					},
				},
			},
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'rid' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
				'Invalid Room': {
					value: {
						success: false,
						error: 'Invalid room [error-invalid-room]',
						errorType: 'error-invalid-room',
						details: {
							method: 'e2e.getUsersOfRoomWithoutKey',
						},
					},
				},
			},
		},
	},
	'e2e.updateGroupKey': {
		response: {
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'rid' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					uid: 'd26x6zSkaPSe5gCyy',
					rid: '9R1V4t3_k3Y',
					key: 'M4-Ubd4T3d-k39',
				},
			},
		},
	},
	'e2e.setUserPublicAndPrivateKeys': {
		response: {
			'400': {
				'Invalid Params': {
					value: {
						success: false,
						error: "must have required property 'public_key' [invalid-params]",
						errorType: 'invalid-params',
					},
				},
			},
		},
		body: {
			Example: {
				value: {
					public_key: 'My-9UbLiK-k34',
					private_key: '9R1V4t3_k3Y',
				},
			},
		},
	},
};
