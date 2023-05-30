import type { Data } from '../../types/Data';

const base64Image =
	'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';

export const validData = {
	visitor: { name: 'John Doe', username: 'john.doe' },
	agent: { name: 'Jane Smith', username: 'jane.smith' },
	siteName: 'example.com',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'UTC',
	messages: [
		{ ts: '2022-11-21T16:00:00.000Z', text: 'Hello, how can I help you today?' },
		{ ts: '2022-11-21T16:00:00.000Z', text: 'I am having trouble with my account.' },
	],
	translations: [
		{ key: 'transcript', value: 'Transcript' },
		{ key: 'visitor', value: 'Visitor' },
		{ key: 'agent', value: 'Agent' },
		{ key: 'siteName', value: 'Site Name' },
		{ key: 'date', value: 'Date' },
		{ key: 'time', value: 'Time' },
	],
};

export const invalidData = {} as Data;

export const newDayData = {
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	messages: [
		{ ts: '2022-11-21T16:00:00.000Z', text: 'Hello' },
		{ ts: '2022-11-22T16:00:00.000Z', text: 'How are you' },
	],
};

export const sameDayData = {
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	messages: [
		{ ts: '2022-11-21T16:00:00.000Z', text: 'Hello' },
		{ ts: '2022-11-21T16:00:00.000Z', text: 'How are you' },
	],
};

export const translationsData = {
	translations: [
		{ key: 'transcript', value: 'Transcript' },
		{ key: 'visitor', value: 'Visitor' },
		{ key: 'agent', value: 'Agent' },
		{ key: 'date', value: 'Date' },
		{ key: 'time', value: 'Time' },
	],
};

export const validFile = { name: 'screenshot.png', buffer: Buffer.from([1, 2, 3]) };

export const invalidFile = { name: 'audio.mp3', buffer: null };

export const validMessage = {
	msg: 'Hello, how can I help you today?',
	ts: '2022-11-21T16:00:00.000Z',
	u: {
		_id: '123',
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
};

export const exampleData = {
	agent: {
		name: 'Juanito De Ponce',
		username: 'juanito.ponce',
	},
	visitor: {
		name: 'Christian Castro',
		username: 'christian.castro',
	},
	siteName: 'Rocket.Chat',
	closedAt: '2022-11-21T00:00:00.000Z',
	dateFormat: 'MMM D, YYYY',
	timeAndDateFormat: 'MMM D, YYYY H:mm:ss',
	timezone: 'Etc/GMT+1',
	translations: [
		{ key: 'Chat_transcript', value: 'Chat transcript' },
		{ key: 'Agent', value: 'Agent' },
		{ key: 'Date', value: 'Date' },
		{ key: 'Customer', value: 'Customer' },
		{ key: 'Time', value: 'Time' },
		{ key: 'This_attachment_is_not_supported', value: 'Attachment format not supported' },
	],
	messages: [
		{
			msg: 'Hello, how can I help you today?',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
		},
		{
			msg: 'I am having trouble with my account.',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			md: [
				{
					type: 'UNORDERED_LIST',
					value: [
						{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'I am having trouble with my account;' }] },
						{
							type: 'LIST_ITEM',
							value: [
								{ type: 'PLAIN_TEXT', value: 'I am having trouble with my password. ' },
								{ type: 'EMOJI', value: undefined, unicode: '🙂' },
							],
						},
					],
				},
			],
		},
		{
			msg: 'Can you please provide your account email?',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
		},
		{
			msg: 'myemail@example.com',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			files: [{ name: 'screenshot.png', buffer: Buffer.from(base64Image, 'base64') }],
		},
		{
			msg: 'Thank you, I am checking on that for you now.',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			files: [invalidFile],
		},
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			quotes: [
				{
					name: 'Christian Castro',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
								},
							],
						},
					],
				},
			],
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{ type: 'PLAIN_TEXT', value: 'I have fixed the issue, is there anything else I can help you with? ' },
						{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' } },
					],
				},
			],
		},
		{
			msg: 'No, that is all. Thank you for your help.',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{ type: 'PLAIN_TEXT', value: 'No, that is all. Thank you for your help. ' },
						{ type: 'INLINE_CODE', value: { type: 'PLAIN_TEXT', value: 'Inline code' } },
					],
				},
			],
		},
		{
			msg: 'Consectetur adipiscing eli.',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'I am having trouble with my password. ' }],
				},
			],
			quotes: [
				{
					name: 'Juanito De Ponce',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
								},
							],
						},
					],
				},
				{
					name: 'Juanito De Ponce',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'Adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
								},
							],
						},
					],
				},
			],
		},
		{
			msg: 'You are welcome. Have a great day!',
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
			md: [
				{
					type: 'CODE',
					value: [
						{ type: 'CODE_INLINE', value: { type: 'PLAIN_TEXT', value: 'Multi line code' } },
						{ type: 'CODE_INLINE', value: { type: 'PLAIN_TEXT', value: '' } },
						{ type: 'CODE_INLINE', value: { type: 'PLAIN_TEXT', value: '--rcx-color-button-background-success-focus: #general;' } },
						{ type: 'CODE_INLINE', value: { type: 'PLAIN_TEXT', value: '--rcx-color-button-background-success-keyfocus: #1D7256;' } },
					],
				},
			],
		},
		{
			msg: 'You are welcome. Have a great day!',
			ts: '2022-11-22T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
		},
		{
			msg: 'Do you have any question?',
			ts: '2022-11-22T16:00:00.000Z',
			u: {
				_id: '123',
				name: 'Juanito De Ponce',
				username: 'juanito.ponce',
			},
		},
		{
			ts: '2022-11-22T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'PLAIN_TEXT',
							value:
								'Ac aliquet odio mattis. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat ',
						},
						{
							type: 'BOLD',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'bold ',
								},
							],
						},
						{
							type: 'STRIKE',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'strike ',
								},
							],
						},
						{
							type: 'ITALIC',
							value: [
								{
									type: 'PLAIN_TEXT',
									value: 'italic ',
								},
							],
						},
						{
							type: 'BOLD',
							value: [
								{
									type: 'STRIKE',
									value: [
										{
											type: 'ITALIC',
											value: [
												{
													type: 'PLAIN_TEXT',
													value: 'all together',
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		},
		{
			ts: '2022-11-21T16:00:00.000Z',
			u: {
				_id: '321',
				name: 'Christian Castro',
				username: 'cristiano.castro',
			},
			md: [
				{
					type: 'PARAGRAPH',
					value: [
						{
							type: 'LINK',
							value: {
								label: [{ type: 'PLAIN_TEXT', value: ' ' }],
								src: { type: 'PLAIN_TEXT', value: 'linktoquote' },
							},
						},
						{ type: 'PLAIN_TEXT', value: 'Consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.' },
					],
				},
			],
			quotes: [
				{
					name: 'Juanito De Ponce',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value:
										'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
								},
							],
						},
					],
				},
				{
					name: 'Christian Castro',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value:
										'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
								},
							],
						},
					],
				},
				{
					name: 'Juanito De Ponce',
					time: '2022-11-21T16:00:00.000Z',
					md: [
						{
							type: 'PARAGRAPH',
							value: [
								{
									type: 'PLAIN_TEXT',
									value:
										'Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
								},
							],
						},
					],
				},
			],
		},
	],
};
